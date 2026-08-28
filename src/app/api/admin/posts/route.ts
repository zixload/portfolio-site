import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import {
  assertSameOrigin,
  getClientFingerprint,
  hasAdminSession,
} from "@/lib/admin/auth";
import { deletePostFromGitHub, publishToGitHub } from "@/lib/admin/github";
import { checkRateLimit } from "@/lib/admin/rate-limit";
import { validatePublication } from "@/lib/admin/validation";
import { managedPosts } from "@/lib/managed-posts";

export const runtime = "nodejs";

function response(body: unknown, status = 200, extraHeaders?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

export async function GET(request: Request) {
  if (!(await hasAdminSession())) return response({ error: "Non autorisé." }, 401);
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return response({ posts: managedPosts });
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return response({ error: "Slug invalide." }, 400);
  }
  const post = managedPosts.find((candidate) => candidate.slug === slug);
  if (!post) return response({ error: "Article introuvable." }, 404);
  try {
    const markdown = fs.readFileSync(
      path.join(process.cwd(), "src", "posts", `${slug}.md`),
      "utf8",
    );
    return response({ post, markdown });
  } catch {
    return response({ error: "Fichier Markdown introuvable." }, 404);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!(await hasAdminSession())) return response({ error: "Non autorisé." }, 401);
    const limit = await checkRateLimit(
      `publish:${getClientFingerprint(request)}`,
      20,
      60 * 60,
    );
    if (!limit.allowed) {
      return response(
        { error: "Limite de publication atteinte. Réessaie plus tard." },
        429,
        { "Retry-After": String(limit.retryAfter) },
      );
    }
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 14 * 1024 * 1024) {
      return response({ error: "Publication trop volumineuse." }, 413);
    }
    const publication = validatePublication(await request.json());
    const commit = await publishToGitHub(publication);
    return response({ ok: true, commit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publication impossible.";
    if (message === "INVALID_ORIGIN") return response({ error: "Origine refusée." }, 403);
    if (message.includes("RATE_LIMIT_NOT_CONFIGURED")) {
      return response({ error: "Le rate-limit de production n'est pas configuré." }, 503);
    }
    if (message.startsWith("GitHub API 409:") || message.startsWith("GitHub API 422:")) {
      return response({ error: "Le dépôt a changé pendant la publication. Recharge et réessaie." }, 409);
    }
    const isConfigurationError =
      message.includes("GITHUB_CONTENT_") || message.includes("not configured");
    return response({ error: message }, isConfigurationError ? 503 : 400);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    if (!(await hasAdminSession())) return response({ error: "Non autorisé." }, 401);
    const limit = await checkRateLimit(
      `delete:${getClientFingerprint(request)}`,
      10,
      60 * 60,
    );
    if (!limit.allowed) {
      return response(
        { error: "Limite de suppression atteinte. Réessaie plus tard." },
        429,
        { "Retry-After": String(limit.retryAfter) },
      );
    }
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 1_024) return response({ error: "Requête invalide." }, 413);
    const payload = (await request.json()) as { slug?: unknown };
    const slug = typeof payload.slug === "string" ? payload.slug : "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return response({ error: "Slug invalide." }, 400);
    }
    if (!managedPosts.some((post) => post.slug === slug)) {
      return response({ error: "Article introuvable." }, 404);
    }
    const commit = await deletePostFromGitHub(slug);
    return response({ ok: true, commit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Suppression impossible.";
    if (message === "INVALID_ORIGIN") return response({ error: "Origine refusée." }, 403);
    if (message.includes("RATE_LIMIT_NOT_CONFIGURED")) {
      return response({ error: "Le rate-limit de production n'est pas configuré." }, 503);
    }
    if (message.startsWith("GitHub API 409:") || message.startsWith("GitHub API 422:")) {
      return response({ error: "Le dépôt a changé. Recharge et réessaie." }, 409);
    }
    const isConfigurationError =
      message.includes("GITHUB_CONTENT_") || message.includes("not configured");
    return response({ error: message }, isConfigurationError ? 503 : 400);
  }
}
