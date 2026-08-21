import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import { SidebarVisual } from "@/components/sidebar-visual";
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
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-[var(--background)] font-serif text-[var(--foreground)]">
        <LocaleProvider>
          <Nav />
          <main className="mx-auto grid w-full max-w-5xl flex-1 gap-16 px-6 py-16 sm:px-0 md:grid-cols-[1fr_320px] md:items-start">
            <div className="min-w-0">{children}</div>
            <div
              className="hidden md:sticky md:top-10 md:block"
              style={{ animation: "fadeUp 0.7s ease-out 180ms both" }}
            >
              <SidebarVisual />
            </div>
          </main>
        </LocaleProvider>
      </body>
    </html>
  );
}
