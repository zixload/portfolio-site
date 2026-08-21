import Image from "next/image";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { findEntry } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { getAllPostSlugs, getPostSource } from "@/lib/posts";

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let source: string;
  try {
    source = getPostSource(slug);
  } catch {
    notFound();
  }

  const entry = findEntry(slug);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {entry && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Image
            src="/icon.png"
            alt="zixload"
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded-full object-cover"
          />
          <span>{formatDate(entry.date, "fr")} · zixload</span>
        </div>
      )}

      <Markdown source={source} />
    </div>
  );
}
