import posts from "@/posts/index.json";

export type ManagedPost = {
  slug: string;
  date: string;
  section: "journal" | "research";
  title: { fr: string; en: string };
  description: { fr: string; en: string };
  image?: string; // vignette, sinon un dégradé est généré depuis le slug
  wip?: boolean; // encore en cours d'écriture
};

export const managedPosts = posts as ManagedPost[];

export function managedEntries(
  locale: "fr" | "en",
  section: ManagedPost["section"],
) {
  return managedPosts
    .filter((post) => post.section === section)
    .map((post) => ({
      slug: post.slug,
      title: post.title[locale],
      date: post.date,
      description: post.description[locale],
      post: true as const,
      image: post.image,
      wip: post.wip,
    }));
}
