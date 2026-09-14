import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import { SidebarVisual } from "@/components/sidebar-visual";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SoundEffects } from "@/components/sound-effects";
import { LocaleProvider } from "@/lib/locale-context";
import { content, showSidebarVisual, site } from "@/lib/content";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-[var(--background)] font-sans text-[0.9375rem] text-[var(--foreground)]">
        <LocaleProvider>
          <SmoothScroll />
          <SoundEffects />
          <Nav />
          {/* Colonne unique centrée : la vidéo est passée sous le contenu,
              à la même largeur que le texte, et reste présente sur toutes les
              pages. */}
          <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-14 px-6 py-16 sm:px-0">
            <div className="min-w-0">{children}</div>
            {showSidebarVisual && (
              <div style={{ animation: "fadeUp 0.7s ease-out 180ms both" }}>
                <SidebarVisual />
              </div>
            )}
          </main>
        </LocaleProvider>
      </body>
    </html>
  );
}
