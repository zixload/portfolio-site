import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import { LocaleProvider } from "@/lib/locale-context";
import { content, site } from "@/lib/content";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: site.name,
  description: content.fr.bio[0],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--background)] font-serif text-[var(--foreground)]">
        <LocaleProvider>
          <Nav />
          <main className="mx-auto flex w-full flex-1 flex-col px-6 py-16 sm:px-0">
            {children}
          </main>
        </LocaleProvider>
      </body>
    </html>
  );
}
