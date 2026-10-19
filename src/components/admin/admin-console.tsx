"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Markdown } from "@/components/markdown";
import type { ManagedPost } from "@/lib/managed-posts";

type EditorImage = { name: string; type: string; content: string };
type EditorForm = {
  slug: string;
  date: string;
  section: "journal" | "research";
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  markdown: string;
};

const fieldClass =
  "w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-800 dark:focus:border-zinc-500";
const buttonClass =
  "rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:border-zinc-400";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): EditorForm {
  return {
    slug: "",
    date: today(),
    section: "journal",
    titleFr: "",
    titleEn: "",
    descriptionFr: "",
    descriptionEn: "",
    markdown: "# ",
  };
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function imageName(file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const stem = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  return `${stem}.${extensions[file.type] || "bin"}`;
}

function fileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error(`Impossible de lire ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export function AdminConsole() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [images, setImages] = useState<EditorImage[]>([]);
  const [slugLocked, setSlugLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string; url?: string } | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const loadPosts = async () => {
    const response = await fetch("/api/admin/posts", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    const payload = (await response.json()) as { posts?: ManagedPost[] };
    setPosts(payload.posts || []);
  };

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { authenticated?: boolean }) => {
        const active = Boolean(payload.authenticated);
        setAuthenticated(active);
        if (active) void loadPosts();
      })
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const key = `portfolio-admin-draft:${form.slug || "new"}`;
    const timer = window.setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({ form }));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [authenticated, form]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Connexion refusée.");
      setPassword("");
      setAuthenticated(true);
      await loadPosts();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Erreur." });
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
  };

  const resetEditor = () => {
    setForm(emptyForm());
    setImages([]);
    setSlugLocked(false);
    setMessage(null);
  };

  const restoreDraft = () => {
    const raw = localStorage.getItem(`portfolio-admin-draft:${form.slug || "new"}`);
    if (!raw) {
      setMessage({ kind: "error", text: "Aucun brouillon local trouvé pour ce slug." });
      return;
    }
    try {
      const draft = JSON.parse(raw) as { form: EditorForm; images?: EditorImage[] };
      setForm(draft.form);
      setImages(draft.images || []);
      setSlugLocked(Boolean(draft.form.slug));
      setMessage({ kind: "success", text: "Brouillon local restauré." });
    } catch {
      setMessage({ kind: "error", text: "Brouillon local illisible." });
    }
  };

  const loadPost = async (slug: string) => {
    if (!slug) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        post?: ManagedPost;
        markdown?: string;
        error?: string;
      };
      if (!response.ok || !payload.post) throw new Error(payload.error || "Chargement impossible.");
      setForm({
        slug: payload.post.slug,
        date: payload.post.date,
        section: payload.post.section,
        titleFr: payload.post.title.fr,
        titleEn: payload.post.title.en,
        descriptionFr: payload.post.description.fr,
        descriptionEn: payload.post.description.en,
        markdown: payload.markdown || "",
      });
      setImages([]);
      setSlugLocked(true);
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Erreur." });
    } finally {
      setBusy(false);
    }
  };

  const insertAtCursor = (value: string) => {
    const element = textarea.current;
    const start = element?.selectionStart ?? form.markdown.length;
    const end = element?.selectionEnd ?? start;
    setForm((current) => ({
      ...current,
      markdown: `${current.markdown.slice(0, start)}${value}${current.markdown.slice(end)}`,
    }));
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + value.length, start + value.length);
    });
  };

  const importImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    if (!form.slug) {
      setMessage({ kind: "error", text: "Ajoute d'abord un titre ou un slug." });
      return;
    }
    try {
      const next: EditorImage[] = [];
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
          throw new Error(`${file.name} : format refusé.`);
        }
        if (file.size > 3 * 1024 * 1024) throw new Error(`${file.name} dépasse 3 Mo.`);
        let name = imageName(file);
        let suffix = 2;
        const names = new Set([...images, ...next].map((image) => image.name));
        while (names.has(name)) {
          name = imageName(file).replace(/(\.[^.]+)$/, `-${suffix}$1`);
          suffix += 1;
        }
        next.push({ name, type: file.type, content: await fileAsBase64(file) });
        insertAtCursor(`\n![Décris cette image](/blog/${form.slug}/${name})\n`);
      }
      setImages((current) => [...current, ...next]);
      setMessage({ kind: "success", text: `${next.length} image(s) ajoutée(s).` });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Import impossible." });
    }
  };

  const publish = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          date: form.date,
          section: form.section,
          title: { fr: form.titleFr, en: form.titleEn || form.titleFr },
          description: {
            fr: form.descriptionFr,
            en: form.descriptionEn || form.descriptionFr,
          },
          markdown: form.markdown,
          images,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        commit?: { url: string; branch: string };
      };
      if (!response.ok) throw new Error(payload.error || "Publication impossible.");
      localStorage.removeItem(`portfolio-admin-draft:${form.slug || "new"}`);
      setMessage({
        kind: "success",
        text: `Publié sur ${payload.commit?.branch}. Le redéploiement va démarrer.`,
        url: payload.commit?.url,
      });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Erreur." });
    } finally {
      setBusy(false);
    }
  };

  const deletePost = async () => {
    if (!slugLocked || !form.slug) return;
    const confirmed = window.confirm(
      `Supprimer définitivement « ${form.titleFr || form.slug} » et ses images ?`,
    );
    if (!confirmed) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: form.slug }),
      });
      const payload = (await response.json()) as {
        error?: string;
        commit?: { url: string; branch: string };
      };
      if (!response.ok) throw new Error(payload.error || "Suppression impossible.");
      localStorage.removeItem(`portfolio-admin-draft:${form.slug}`);
      const deletedSlug = form.slug;
      const deletedTitle = form.titleFr || form.slug;
      resetEditor();
      setPosts((current) => current.filter((post) => post.slug !== deletedSlug));
      setMessage({
        kind: "success",
        text: `« ${deletedTitle} » supprimé sur ${payload.commit?.branch}.`,
        url: payload.commit?.url,
      });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Erreur." });
    } finally {
      setBusy(false);
    }
  };

  if (authenticated === null) {
    return <div className="fixed inset-0 z-[400] grid place-items-center bg-[var(--background)] text-sm">Vérification…</div>;
  }

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-[400] grid place-items-center bg-[var(--background)] px-6">
        <form onSubmit={login} className="flex w-full max-w-xs flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">portfolio</p>
            <h1 className="mt-1 text-xl font-semibold">Administration</h1>
          </div>
          <label className="flex flex-col gap-1.5 text-xs text-zinc-500">
            Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
              maxLength={256}
              required
              autoFocus
            />
          </label>
          {message ? <p className="text-xs text-red-600 dark:text-red-400">{message.text}</p> : null}
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? "Vérification…" : "Entrer"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[400] overflow-y-auto bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-5 py-3 backdrop-blur-xl dark:border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">portfolio</p>
            <h1 className="text-sm font-semibold">Éditeur Markdown</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" className={buttonClass} onClick={resetEditor}>Nouveau</button>
            <button type="button" className={buttonClass} onClick={logout}>Sortir</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-5">
          {posts.length ? (
            <label className="flex flex-col gap-1.5 text-xs text-zinc-500">
              Modifier un article administré
              <select className={fieldClass} defaultValue="" onChange={(event) => void loadPost(event.target.value)}>
                <option value="">Choisir…</option>
                {posts.map((post) => <option key={post.slug} value={post.slug}>{post.title.fr}</option>)}
              </select>
            </label>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-xs text-zinc-500">
              Date
              <input type="date" className={fieldClass} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-zinc-500">
              Section
              <select className={fieldClass} value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value as EditorForm["section"] })}>
                <option value="journal">Journal</option>
                <option value="research">Recherche</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-zinc-500">
              Slug
              <input
                className={fieldClass}
                value={form.slug}
                onChange={(event) => {
                  setSlugLocked(true);
                  setForm({ ...form, slug: slugify(event.target.value) });
                }}
                placeholder="mon-article"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-xs text-zinc-500">
            Titre français
            <input
              className={fieldClass}
              value={form.titleFr}
              onChange={(event) => {
                const titleFr = event.target.value;
                setForm({ ...form, titleFr, slug: slugLocked ? form.slug : slugify(titleFr) });
              }}
              maxLength={140}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-zinc-500">
            Description française
            <textarea className={`${fieldClass} min-h-20 resize-y`} value={form.descriptionFr} onChange={(event) => setForm({ ...form, descriptionFr: event.target.value })} maxLength={420} />
          </label>

          <details className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <summary className="cursor-pointer text-xs text-zinc-500">Version anglaise — optionnelle</summary>
            <div className="mt-4 flex flex-col gap-4">
              <input className={fieldClass} value={form.titleEn} onChange={(event) => setForm({ ...form, titleEn: event.target.value })} placeholder="English title" maxLength={140} />
              <textarea className={`${fieldClass} min-h-20 resize-y`} value={form.descriptionEn} onChange={(event) => setForm({ ...form, descriptionEn: event.target.value })} placeholder="English description" maxLength={420} />
            </div>
          </details>

          <label className="flex flex-col gap-1.5 text-xs text-zinc-500">
            Markdown
            <textarea
              ref={textarea}
              className={`${fieldClass} min-h-[34rem] resize-y font-mono leading-relaxed`}
              value={form.markdown}
              onChange={(event) => setForm({ ...form, markdown: event.target.value })}
              spellCheck
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <label className={`${buttonClass} cursor-pointer`}>
              Importer des images
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={(event) => void importImages(event)} />
            </label>
            <button type="button" className={buttonClass} onClick={restoreDraft}>Restaurer le brouillon</button>
            <button
              type="button"
              className={`${buttonClass} border-red-300 text-red-600 hover:border-red-600 dark:border-red-900 dark:text-red-400`}
              onClick={deletePost}
              disabled={busy || !posts.some((post) => post.slug === form.slug)}
            >
              Supprimer
            </button>
            <button type="button" className={`${buttonClass} ml-auto border-zinc-900 bg-zinc-900 text-white hover:border-zinc-700 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900`} onClick={publish} disabled={busy}>
              {busy ? "Publication…" : "Publier sur GitHub"}
            </button>
          </div>

          {images.length ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((image) => (
                <figure key={image.name} className="min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`data:${image.type};base64,${image.content}`} alt="" className="aspect-square w-full rounded object-cover" />
                  <figcaption className="mt-1 truncate text-[10px] text-zinc-500">{image.name}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}

          {message ? (
            <p className={`text-xs ${message.kind === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
              {message.text}{message.url ? <> — <a href={message.url} target="_blank" rel="noreferrer" className="underline">voir le commit</a></> : null}
            </p>
          ) : null}
        </section>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-zinc-400">Aperçu</p>
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-zinc-200 bg-[var(--background)] p-6 dark:border-zinc-800 sm:p-8">
            <Markdown source={form.markdown} />
          </div>
        </aside>
      </main>
    </div>
  );
}
