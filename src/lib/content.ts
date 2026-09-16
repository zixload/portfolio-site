import { managedEntries } from "@/lib/managed-posts";

// Contenu centralisé du site — à adapter au fil du temps.
// Bilingue FR/EN : voir `content` plus bas. `site`, `links` et les chemins
// d'images restent partagés entre les deux langues.

export type Locale = "fr" | "en";

export const site = {
  name: "zix",
  handle: "@luca",
  email: "luca.silva.r456@gmail.com",
  location: "Paris",
};

// Bascule le lien "show more" qui déplie la bio longue sous la bio courte.
export const showLongBio = true;

// Vidéo de fin de page désactivée : la source (480x624, portrait) est trop
// petite pour la largeur actuelle. À remettre à `true` avec un rendu plus large.
export const showSidebarVisual = false;

export const links = [
  { label: "GitHub", href: "https://github.com/zixload" },
];

export type Entry = {
  slug: string;
  title: string;
  date: string; // ISO
  description: string;
  href?: string; // lien externe optionnel (PDF, repo, etc.)
  post?: boolean; // true = page interne /blog/{slug} (Markdown), rendu via src/posts/{slug}.md
  image?: string; // vignette illustrant l'entrée, ex. "/media/writing/mon-post.png"
  wip?: boolean; // article encore en cours d'écriture : affiche la pastille "writing…"
};

// Terme survolable dans la ligne des centres d'intérêt : au survol, ses images
// se déploient en petites cartes au-dessus du mot.
export type Interest = {
  label: string;
  images: string[];
};

// Images partagées entre les deux langues.
export const media = {
  currentlyReadingCover: "/media/shadow-slave-cover.jpg",
  currentlyReadingIllustration: "/media/shadow-slave-illustration.jpg",
  combatSportsPhoto: "/media/photo_box.png",
  lolScreens: [
    "/media/lol-challenger-flex.png",
    "/media/lol-master-1.png",
    "/media/lol-master-2.png",
    "/media/lol-master-3.png",
    "/media/lol-master-4.png",
  ],
};

type LocaleContent = {
  nav: { href: string; label: string }[];
  bio: string[];
  bioLong: string[];
  readingBlurb: string; // paragraphe lecture, affiché à côté de la carte du livre
  githubLine: string; // phrase qui introduit le lien GitHub, dans la bio
  bioMoreLabel: string; // déplie la bio longue
  bioLessLabel: string; // la referme
  combatSportsBlurb: string;
  combatSportsCaption: string;
  lolBlurb: string;
  currentlyReading: {
    title: string;
    author: string;
    label: string; // "En train de lire" / "Currently reading"
    abstractLabel: string; // "Abstract"
    abstract: string;
    quote: string;
    quoteNote: string;
  };
  beliefs: string[];
  interests: { heading: string; items: Interest[] };
  research: Entry[];
  journal: Entry[];
  pages: {
    recherche: { title: string; description: string };
    journal: { title: string; description: string };
    convictions: { title: string };
  };
  blogsHeading: string;
};

export const content: Record<Locale, LocaleContent> = {
  fr: {
    nav: [
      { href: "/", label: "Accueil" },
      { href: "/recherche", label: "Recherche" },
    ],
    bio: [
      "Je suis un étudiant plutôt curieux mais basique, j'apprends la finance quantitative, la gestion des risques et des actifs. D'autres passions m'animent aussi : le code, les languages bas niveau, la sécurité informatique, la cryptographie et la lecture.",
      "Le travail auquel j'aspire serait de contribuer à la recherche et au développement de stratégies quantitatives, et plus tard rejoindre une équipe Red Team ou de recherche en sécurité informatique.",
    ],
    bioLong: [
      "Licence économie-gestion à Bayonne, un an de Master corporate finance à Bordeaux, et je finis un Master gestion des risques et des actifs à Paris-Saclay. En chemin : calibration de modèles stochastiques, gestion de portefeuilles, risques extrêmes.",
    ],
    readingBlurb:
      "En ce moment je lis Shadow Slave (Guiltythree). Ce qui me plaît, c'est la plume de l'auteur : la narration se mêle aux pensées de Sunny, on se croirait dans sa tête.",
    githubLine: "Tu peux voir ce que je fais sur",
    bioMoreLabel: "show more",
    bioLessLabel: "show less",
    combatSportsBlurb:
      "J'ai pratiqué la boxe thaï pendant pas mal d'années, et j'ai adoré le côté stratégique et technique. Je regarde aussi beaucoup de MMA, et j'ai hâte que Salahdine Parnasse devienne champion, parce que oui, il le sera à l'UFC.",
    lolBlurb:
      "Sinon je joue à League of Legends — Master en solo/duo, et même passé Challenger en Flex 5v5 une fois. Pas mon activité principale, mais toujours satisfaisant de grind un peu de ranked.",
    combatSportsCaption: "Avec Salahdine Parnasse",
    currentlyReading: {
      title: "Shadow Slave",
      author: "Guiltythree",
      label: "En train de lire",
      abstractLabel: "Abstract",
      abstract:
        "Ayant grandi dans la pauvreté, Sunny attendait peu de choses de la vie. Il n'avait cependant pas prévu d'être choisi par le Sortilège du Cauchemar et de devenir un Éveillé — un groupe d'élite de personnes douées de pouvoirs surnaturels. Transporté dans un monde magique en ruine, il se retrouve confronté à de terribles monstres — et à d'autres Éveillés — dans une lutte mortelle pour la survie. Pire encore, le pouvoir divin qu'il a reçu possède un effet secondaire mineur, mais potentiellement fatal...",
      quote:
        "Her already prolific fame and exalted status instantly soared as high as the sun. While Nephis slept, her arrival was already creating titanic waves in the mindset of millions of people. In front of the Awakened Academy, a hundred thousand candles continued to burn despite the falling snow. ...And cast by their flames, a hundred thousand shadows danced on the ground.",
      quoteNote: "Chapitre 766 — Making History",
    },
    beliefs: [
      "Un backtest qui marche trop bien est un bug, pas un edge.",
      "Le shrinkage simple bat souvent le modèle sophistiqué mal calibré.",
      "Comprendre pourquoi ça casse compte plus que savoir que ça marche.",
      "Un résultat qui contredit ton hypothèse reste un résultat.",
      "Le risque qu'on ne mesure pas est celui qui finit par coûter cher.",
      "Lire le papier original vaut mieux que lire le résumé qu'on t'en a fait.",
      "Le reverse engineering, c'est de la lecture attentive avant tout.",
      "Un CTF raté enseigne plus qu'un CTF résolu en cinq minutes.",
      "Le code qui marche une fois ne prouve rien.",
      "Automatiser une tâche dès qu'on la refait une troisième fois.",
      "Le turnover coûte toujours plus cher qu'on ne l'anticipe.",
      "On apprend davantage en cassant les choses qu'en les utilisant.",
      "La discipline bat la motivation sur la durée.",
      "Écrire clairement force à penser clairement.",
      "Douter de ses propres résultats avant de les défendre.",
    ],
    interests: {
      heading: "Centres d'intérêt",
      items: [
        { label: "boxe thaï", images: [media.combatSportsPhoto] },
        { label: "league of legends", images: media.lolScreens.slice(0, 3) },
        {
          label: "webnovels",
          images: [
            media.currentlyReadingCover,
            media.currentlyReadingIllustration,
          ],
        },
      ],
    },
    research: [
      ...managedEntries("fr", "research"),
      {
        slug: "memoire-m2-minimum-variance",
        title:
          "Décomposition de la covariance, prévisions de volatilité et de corrélation pour l'allocation minimum-variance",
        date: "2026-08-14",
        description:
          "Mémoire M2 — Gestion des Risques et des Actifs (Paris-Saclay) : grille factorielle croisant deux modèles de variance (empirique, GARCH) et trois modèles de corrélation (empirique, shrinkage Ledoit-Wolf, DCC), backtestée sur 281 actions américaines (2005–2025). Le shrinkage de la corrélation réduit systématiquement le risque réalisé du portefeuille minimum-variance ; le GARCH le détériore ; le DCC n'apporte de gain robuste dans aucune configuration.",
      },
      {
        slug: "memoire-m1-chocs-geopolitiques",
        title:
          "Réactions différenciées des marchés financiers aux chocs géopolitiques",
        date: "2025-08-01",
        description:
          "Mémoire M1 — Gestion des Risques et des Actifs (Paris-Saclay) : l'or, le pétrole (WTI) et les indices boursiers (S&P 500, MSCI Asie) face aux chocs géopolitiques 2017–2023, via l'indice GPR (Caldara-Iacoviello) et des modèles VAR / DCC-GARCH. L'or confirme son rôle de valeur refuge ; le pétrole réagit selon la nature du choc.",
      },
      {
        slug: "memoire-m1-finance-inegalites",
        title: "Finance et inégalité de revenu : une approche moderne",
        date: "2024-05-01",
        description:
          "Mémoire M1 — Corporate Finance (IAE Bordeaux) : 136 pays, 1980–2021 — le développement financier suit une relation en U inversé avec les inégalités de revenu (indice FD du FMI), seuil de retournement autour de 0,49. Confirme l'hypothèse de Greenwood et Jovanic (1990).",
      },
    ],
    journal: [
      ...managedEntries("fr", "journal"),
      {
        slug: "sabr-heston-spx-vix",
        title: "Calibration of SABR and Heston Models on SPX and VIX Options",
        date: "2026-04-10",
        description:
          "Projet de groupe (ENSIIE) : comparaison SABR vs Heston sur options SPX et VIX, en calibration standard et jointe. SABR domine sur SPX (RMSE 0,43 pt) mais échoue sur VIX (117 pts) ; la version jointe corrige le VIX (14,7 pts) au prix du SPX (0,89 pt). Heston joint offre le meilleur compromis global.",
        post: true,
        image: "/media/writing/sabr-heston-spx-vix.jpg",
      },
      {
        slug: "asset-management-group-project",
        title: "Robust GMV, Machine Learning Views & Portfolio Insurance",
        date: "2025-12-17",
        description:
          "Projet de groupe : portefeuille à variance minimale robuste (Ledoit-Wolf), allocation dynamique avec vues Machine Learning (XGBoost + Black-Litterman), stratégies d'assurance de portefeuille (OBPI vs CPPI, simulations Monte Carlo).",
        post: true,
        image: "/media/writing/asset-management-group-project.jpg",
      },
    ],
    pages: {
      recherche: {
        title: "Recherche",
        description:
          "Mémoires individuels, autour de la gestion quantitative d'actifs.",
      },
      journal: {
        title: "Journal",
        description:
          "Ce que j'apprends au fil du temps — projets de groupe, write-ups HTB/THM, notes de lecture, sans thème fixe.",
      },
      convictions: { title: "Ce que je crois" },
    },
    blogsHeading: "Blogs",
  },
  en: {
    nav: [
      { href: "/", label: "Home" },
      { href: "/recherche", label: "Research" },
    ],
    bio: [
      "I'm a fairly curious but ordinary student, learning quantitative finance, risk and asset management. A few other things keep me busy too: coding, low-level languages, cybersecurity, cryptography, and reading.",
      "The work I'm aiming for would be contributing to research and development of quantitative strategies, and later joining a Red Team or a security research team.",
    ],
    bioLong: [
      "Economics-management degree in Bayonne, a year of a Corporate Finance Master's in Bordeaux, and I'm finishing a Risk & Asset Management Master's at Paris-Saclay. Along the way: stochastic model calibration, portfolio management, extreme risk.",
    ],
    readingBlurb:
      "Right now I'm reading Shadow Slave (Guiltythree). What I like is the author's writing: narration blends into Sunny's thoughts, so it feels like being inside his head.",
    githubLine: "You can check my work on",
    bioMoreLabel: "show more",
    bioLessLabel: "show less",
    combatSportsBlurb:
      "I practiced Muay Thai for quite a few years, and loved the strategic and technical side of it. I also watch a lot of MMA — and I can't wait for Salahdine Parnasse to become champion, because yes, he will be UFC champion.",
    combatSportsCaption: "With Salahdine Parnasse",
    lolBlurb:
      "I also play League of Legends — Master in solo/duo queue, and even hit Challenger in Flex 5v5 once. Not my main thing, but grinding some ranked is always satisfying.",
    currentlyReading: {
      title: "Shadow Slave",
      author: "Guiltythree",
      label: "Currently reading",
      abstractLabel: "Abstract",
      abstract:
        "Growing up in poverty, Sunny didn't expect much from life. He never imagined being chosen by the Nightmare Spell and becoming an Awakened — a member of an elite group gifted with supernatural powers. Transported into a ruined magical world, he finds himself facing terrible monsters — and other Awakened — in a deadly struggle for survival. Worse still, the divine power he received comes with a minor, but potentially fatal, side effect...",
      quote:
        "Her already prolific fame and exalted status instantly soared as high as the sun. While Nephis slept, her arrival was already creating titanic waves in the mindset of millions of people. In front of the Awakened Academy, a hundred thousand candles continued to burn despite the falling snow. ...And cast by their flames, a hundred thousand shadows danced on the ground.",
      quoteNote: "Chapter 766 — Making History",
    },
    beliefs: [
      "A backtest that works too well is a bug, not an edge.",
      "Simple shrinkage often beats a poorly calibrated sophisticated model.",
      "Understanding why it breaks matters more than knowing it works.",
      "A result that contradicts your hypothesis is still a result.",
      "The risk you don't measure is the one that ends up costing you.",
      "Reading the original paper beats reading someone's summary of it.",
      "Reverse engineering is, first and foremost, careful reading.",
      "A failed CTF teaches more than one solved in five minutes.",
      "Code that works once proves nothing.",
      "Automate a task the third time you redo it.",
      "Turnover always costs more than you expect.",
      "You learn more by breaking things than by using them.",
      "Discipline beats motivation over time.",
      "Writing clearly forces you to think clearly.",
      "Doubt your own results before you defend them.",
    ],
    interests: {
      heading: "Interests",
      items: [
        { label: "muay thai", images: [media.combatSportsPhoto] },
        { label: "league of legends", images: media.lolScreens.slice(0, 3) },
        {
          label: "webnovels",
          images: [
            media.currentlyReadingCover,
            media.currentlyReadingIllustration,
          ],
        },
      ],
    },
    research: [
      ...managedEntries("en", "research"),
      {
        slug: "memoire-m2-minimum-variance",
        title:
          "Covariance Decomposition: Volatility and Correlation Forecasts for Minimum-Variance Allocation",
        date: "2026-08-14",
        description:
          "Master's thesis — Risk & Asset Management (Paris-Saclay): a factorial grid crossing two variance models (empirical, GARCH) and three correlation models (empirical, Ledoit-Wolf shrinkage, DCC), backtested on 281 US stocks (2005–2025). Correlation shrinkage systematically reduces realized minimum-variance portfolio risk; GARCH worsens it; DCC brings no robust gain in any configuration.",
      },
      {
        slug: "memoire-m1-chocs-geopolitiques",
        title: "Differentiated Market Reactions to Geopolitical Shocks",
        date: "2025-08-01",
        description:
          "Master's thesis — Risk & Asset Management (Paris-Saclay): gold, oil (WTI) and equity indices (S&P 500, MSCI Asia) facing geopolitical shocks 2017–2023, using the GPR index (Caldara-Iacoviello) and VAR / DCC-GARCH models. Gold confirms its safe-haven role; oil's reaction depends on the nature of the shock.",
      },
      {
        slug: "memoire-m1-finance-inegalites",
        title: "Finance and Income Inequality: A Modern Approach",
        date: "2024-05-01",
        description:
          "Master's thesis — Corporate Finance (IAE Bordeaux): 136 countries, 1980–2021 — financial development follows an inverted-U relationship with income inequality (IMF's FD index), with a turning point around 0.49. Confirms the Greenwood and Jovanic (1990) hypothesis.",
      },
    ],
    journal: [
      ...managedEntries("en", "journal"),
      {
        slug: "sabr-heston-spx-vix",
        title: "Calibration of SABR and Heston Models on SPX and VIX Options",
        date: "2026-04-10",
        description:
          "Group project (ENSIIE): SABR vs Heston comparison on SPX and VIX options, standard and joint calibration. SABR dominates on SPX (RMSE 0.43 pt) but fails on VIX (117 pts); the joint version fixes VIX (14.7 pts) at the cost of SPX (0.89 pt). Joint Heston offers the best overall compromise.",
        post: true,
        image: "/media/writing/sabr-heston-spx-vix.jpg",
      },
      {
        slug: "asset-management-group-project",
        title: "Robust GMV, Machine Learning Views & Portfolio Insurance",
        date: "2025-12-17",
        description:
          "Group project: robust global minimum-variance portfolio (Ledoit-Wolf), dynamic allocation with Machine Learning views (XGBoost + Black-Litterman), portfolio insurance strategies (OBPI vs CPPI, Monte Carlo simulations).",
        post: true,
        image: "/media/writing/asset-management-group-project.jpg",
      },
    ],
    pages: {
      recherche: {
        title: "Research",
        description:
          "Personal master's theses, on quantitative asset management.",
      },
      journal: {
        title: "Journal",
        description:
          "What I learn along the way — group projects, HTB/THM write-ups, reading notes, no fixed theme.",
      },
      convictions: { title: "What I Believe" },
    },
    blogsHeading: "Blogs",
  },
};

// Retrouve la date (et le titre) d'un article Markdown à partir de son slug —
// les articles vivent dans src/posts/, mais leurs métadonnées restent ici.
export function findEntry(slug: string): Entry | undefined {
  return [...content.fr.research, ...content.fr.journal].find(
    (entry) => entry.slug === slug
  );
}
