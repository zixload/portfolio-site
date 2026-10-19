import "server-only";

import type { ManagedPost } from "@/lib/managed-posts";
import type { ValidatedPublication } from "@/lib/admin/validation";

const API_VERSION = "2022-11-28";

type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

function config(): GitHubConfig {
  const token = process.env.GITHUB_CONTENT_TOKEN;
  const repository = process.env.GITHUB_CONTENT_REPOSITORY || "zixload/portfolio-site";
  const [owner, repo, extra] = repository.split("/");
  if (!token) throw new Error("GITHUB_CONTENT_TOKEN n'est pas configuré.");
  if (!owner || !repo || extra) throw new Error("GITHUB_CONTENT_REPOSITORY est invalide.");
  return {
    token,
    owner,
    repo,
    branch: process.env.GITHUB_CONTENT_BRANCH || "master",
  };
}

async function github<T>(
  settings: GitHubConfig,
  path: string,
  init: RequestInit = {},
  accepted = [200, 201],
) {
  const response = await fetch(
    `https://api.github.com/repos/${settings.owner}/${settings.repo}${path}`,
    {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${settings.token}`,
        "X-GitHub-Api-Version": API_VERSION,
        "Content-Type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
    },
  );
  if (!accepted.includes(response.status)) {
    const detail = await response.text();
    throw new Error(`GitHub API ${response.status}: ${detail.slice(0, 300)}`);
  }
  return (await response.json()) as T;
}

async function readRemoteManifest(settings: GitHubConfig) {
  const path = `/contents/src/posts/index.json?ref=${encodeURIComponent(settings.branch)}`;
  try {
    const file = await github<{ content: string; encoding: string }>(settings, path);
    if (file.encoding !== "base64") throw new Error("Encodage du manifeste inattendu.");
    const parsed = JSON.parse(Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8"));
    return Array.isArray(parsed) ? (parsed as ManagedPost[]) : [];
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("GitHub API 404:")) return [];
    throw error;
  }
}

async function createBlob(
  settings: GitHubConfig,
  content: string,
  encoding: "utf-8" | "base64",
) {
  return github<{ sha: string }>(settings, "/git/blobs", {
    method: "POST",
    body: JSON.stringify({ content, encoding }),
  });
}

export async function publishToGitHub(publication: ValidatedPublication) {
  const settings = config();
  const refPath = `/git/ref/heads/${settings.branch.split("/").map(encodeURIComponent).join("/")}`;
  const ref = await github<{ object: { sha: string } }>(settings, refPath);
  const parent = await github<{ tree: { sha: string } }>(
    settings,
    `/git/commits/${ref.object.sha}`,
  );

  const manifest = await readRemoteManifest(settings);
  const nextManifest = manifest.filter((post) => post.slug !== publication.post.slug);
  nextManifest.push(publication.post);
  nextManifest.sort((left, right) => (left.date < right.date ? 1 : -1));

  const files = [
    {
      path: `src/posts/${publication.post.slug}.md`,
      content: Buffer.from(publication.markdown).toString("base64"),
    },
    {
      path: "src/posts/index.json",
      content: Buffer.from(`${JSON.stringify(nextManifest, null, 2)}\n`).toString("base64"),
    },
    ...publication.images.map((image) => ({
      path: `public/blog/${publication.post.slug}/${image.filename}`,
      content: image.content.toString("base64"),
    })),
  ];

  const blobs = await Promise.all(
    files.map((file) => createBlob(settings, file.content, "base64")),
  );
  const tree = await github<{ sha: string }>(settings, "/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: parent.tree.sha,
      tree: files.map((file, index) => ({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobs[index].sha,
      })),
    }),
  });
  const commit = await github<{ sha: string; html_url: string }>(settings, "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: `content: publish ${publication.post.slug}`,
      tree: tree.sha,
      parents: [ref.object.sha],
    }),
  });
  await github(settings, refPath, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return {
    sha: commit.sha,
    url: `https://github.com/${settings.owner}/${settings.repo}/commit/${commit.sha}`,
    branch: settings.branch,
  };
}

export async function deletePostFromGitHub(slug: string) {
  const settings = config();
  const refPath = `/git/ref/heads/${settings.branch.split("/").map(encodeURIComponent).join("/")}`;
  const ref = await github<{ object: { sha: string } }>(settings, refPath);
  const parent = await github<{ tree: { sha: string } }>(
    settings,
    `/git/commits/${ref.object.sha}`,
  );
  const manifest = await readRemoteManifest(settings);
  if (!manifest.some((post) => post.slug === slug)) {
    throw new Error("Article introuvable dans le manifeste distant.");
  }

  const nextManifest = manifest.filter((post) => post.slug !== slug);
  const manifestBlob = await createBlob(
    settings,
    Buffer.from(`${JSON.stringify(nextManifest, null, 2)}\n`).toString("base64"),
    "base64",
  );
  const remoteTree = await github<{
    tree: { path: string; mode: string; type: string; sha: string }[];
    truncated?: boolean;
  }>(settings, `/git/trees/${parent.tree.sha}?recursive=1`);
  if (remoteTree.truncated) {
    throw new Error("L'arbre GitHub est trop volumineux pour supprimer cet article en sécurité.");
  }

  const markdownPath = `src/posts/${slug}.md`;
  const imagePrefix = `public/blog/${slug}/`;
  const pathsToDelete = remoteTree.tree
    .filter(
      (entry) =>
        entry.type === "blob" &&
        (entry.path === markdownPath || entry.path.startsWith(imagePrefix)),
    )
    .map((entry) => entry.path);
  if (!pathsToDelete.includes(markdownPath)) {
    throw new Error("Fichier Markdown distant introuvable.");
  }

  const tree = await github<{ sha: string }>(settings, "/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: parent.tree.sha,
      tree: [
        {
          path: "src/posts/index.json",
          mode: "100644",
          type: "blob",
          sha: manifestBlob.sha,
        },
        ...pathsToDelete.map((path) => ({
          path,
          mode: "100644",
          type: "blob",
          sha: null,
        })),
      ],
    }),
  });
  const commit = await github<{ sha: string; html_url: string }>(settings, "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: `content: delete ${slug}`,
      tree: tree.sha,
      parents: [ref.object.sha],
    }),
  });
  await github(settings, refPath, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return {
    sha: commit.sha,
    url: `https://github.com/${settings.owner}/${settings.repo}/commit/${commit.sha}`,
    branch: settings.branch,
  };
}
