import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export function Markdown({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--foreground)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--foreground)] underline decoration-zinc-300 hover:decoration-[var(--accent)] dark:decoration-zinc-700"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-zinc-200 pl-4 italic text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isBlock = /language-|^$/.test(className ?? "") && className;
            if (!isBlock) {
              return (
                <code className="rounded-sm bg-zinc-100 px-1 py-0.5 font-mono text-[0.9em] text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                  {children}
                </code>
              );
            }
            return <code className={className}>{children}</code>;
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-sm bg-zinc-100 p-4 font-mono text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {children}
            </pre>
          ),
          hr: () => (
            <hr className="border-zinc-200 dark:border-zinc-800" />
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--foreground)]">
              {children}
            </strong>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
