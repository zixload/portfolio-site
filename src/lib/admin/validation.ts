import "server-only";

import type { ManagedPost } from "@/lib/managed-posts";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_TYPES = {
  "image/jpeg": { extension: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/png": { extension: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  "image/gif": { extension: "gif", magic: [0x47, 0x49, 0x46, 0x38] },
  "image/webp": { extension: "webp", magic: [0x52, 0x49, 0x46, 0x46] },
} as const;

type RawImage = { name?: unknown; type?: unknown; content?: unknown };
type RawPost = {
  slug?: unknown;
  date?: unknown;
  section?: unknown;
  title?: { fr?: unknown; en?: unknown };
  description?: { fr?: unknown; en?: unknown };
  markdown?: unknown;
  images?: unknown;
};

export type ValidatedImage = {
  filename: string;
  mimeType: keyof typeof IMAGE_TYPES;
  content: Buffer;
};

export type ValidatedPublication = {
  post: ManagedPost;
  markdown: string;
  images: ValidatedImage[];
};

function text(value: unknown, field: string, max: number, required = true) {
  if (typeof value !== "string") throw new Error(`${field} est invalide.`);
  const clean = value.trim();
  if (required && !clean) throw new Error(`${field} est requis.`);
  if (clean.length > max) throw new Error(`${field} dépasse ${max} caractères.`);
  return clean;
}

function safeFilename(value: unknown, mimeType: keyof typeof IMAGE_TYPES) {
  const original = text(value, "Nom de l'image", 120);
  const stem = original
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!stem) throw new Error("Le nom d'une image est invalide.");
  return `${stem}.${IMAGE_TYPES[mimeType].extension}`;
}

function validateImage(raw: RawImage): ValidatedImage {
  if (typeof raw.type !== "string" || !(raw.type in IMAGE_TYPES)) {
    throw new Error("Format d'image refusé. Utilise JPEG, PNG, WebP ou GIF.");
  }
  const mimeType = raw.type as keyof typeof IMAGE_TYPES;
  if (typeof raw.content !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(raw.content)) {
    throw new Error("Le contenu d'une image est invalide.");
  }
  const content = Buffer.from(raw.content, "base64");
  if (!content.length || content.length > 3 * 1024 * 1024) {
    throw new Error("Chaque image doit peser au maximum 3 Mo.");
  }
  const magic = IMAGE_TYPES[mimeType].magic;
  if (!magic.every((byte, index) => content[index] === byte)) {
    throw new Error("Le type déclaré d'une image ne correspond pas à son contenu.");
  }
  if (mimeType === "image/webp" && content.subarray(8, 12).toString("ascii") !== "WEBP") {
    throw new Error("Image WebP invalide.");
  }
  return { filename: safeFilename(raw.name, mimeType), mimeType, content };
}

export function validatePublication(input: unknown): ValidatedPublication {
  if (!input || typeof input !== "object") throw new Error("Requête invalide.");
  const raw = input as RawPost;
  const slug = text(raw.slug, "Slug", 80);
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error("Le slug doit contenir uniquement a-z, 0-9 et des tirets simples.");
  }
  const date = text(raw.date, "Date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new Error("La date est invalide.");
  }
  if (raw.section !== "journal" && raw.section !== "research") {
    throw new Error("La section est invalide.");
  }

  const titleFr = text(raw.title?.fr, "Titre français", 140);
  const titleEn = text(raw.title?.en ?? titleFr, "Titre anglais", 140);
  const descriptionFr = text(raw.description?.fr, "Description française", 420);
  const descriptionEn = text(
    raw.description?.en ?? descriptionFr,
    "Description anglaise",
    420,
  );
  const markdown = text(raw.markdown, "Contenu Markdown", 120_000);
  const rawImages = Array.isArray(raw.images) ? (raw.images as RawImage[]) : [];
  if (rawImages.length > 8) throw new Error("Maximum 8 images par publication.");
  const images = rawImages.map(validateImage);
  if (new Set(images.map((image) => image.filename)).size !== images.length) {
    throw new Error("Deux images produisent le même nom de fichier.");
  }
  const totalBytes = images.reduce((sum, image) => sum + image.content.length, 0);
  if (totalBytes > 10 * 1024 * 1024) {
    throw new Error("Le total des images doit rester sous 10 Mo.");
  }

  return {
    post: {
      slug,
      date,
      section: raw.section,
      title: { fr: titleFr, en: titleEn },
      description: { fr: descriptionFr, en: descriptionEn },
    },
    markdown: `${markdown.trim()}\n`,
    images,
  };
}
