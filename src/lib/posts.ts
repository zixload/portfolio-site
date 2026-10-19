import fs from "node:fs";
import path from "node:path";

const POSTS_DIR = path.join(process.cwd(), "src/posts");

export function getPostSource(slug: string): string {
  const file = path.join(POSTS_DIR, `${slug}.md`);
  return fs.readFileSync(file, "utf-8");
}

export function getAllPostSlugs(): string[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}
