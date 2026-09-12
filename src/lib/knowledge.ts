import type { IllustrationKind } from "@/components/Illustration/Illustration";

export type ContentBlock =
  | {
      type: "p" | "h2";
      text: string;
      color_symbolic_cube?:
        | "red_color_symbolic_cube"
        | "green_color_symbolic_cube"
        | "orange_color_symbolic_cube"
        | "blue_color_symbolic_cube"
        | "white_color_symbolic_cube";
    }
  | { type: "table"; rows: string[][] };
export type KnowledgeMaterial = {
  title: string;
  kind: "image" | "document";
  file: string;
  format: string;
  width?: number;
  height?: number;
  pages?: { src: string; width: number; height: number }[];
  blocks?: ContentBlock[];
};
export type KnowledgeContent = {
  source: string;
  blocks: ContentBlock[];
  materials: KnowledgeMaterial[];
};
export type KnowledgePage = {
  slug: string;
  title: string;
  hidden?: boolean;
  href?: string;
};
export type KnowledgeGroup = {
  id: string;
  title: string;
  color: "blue" | "pink" | "yellow" | "green";
  illustration: IllustrationKind;
  hidden?: boolean;
  pages: KnowledgePage[];
};

// Keep every old subsection here. Hidden pages are excluded from navigation,
// static routes and the sitemap until their content is ready to publish.
export const KNOWLEDGE_GROUPS: KnowledgeGroup[] = [
  {
    id: "about",
    title: "Про заклад",
    color: "yellow",
    illustration: "school",
    pages: [
      { slug: "information", title: "Інформація про заклад" },
      {
        slug: "history",
        title: "Історія школи",
        href: "/history#school-history",
      },
      { slug: "finance", title: "Кошторис та фінансова інформація" },
      {
        slug: "facilities",
        title: "Матеріально-технічне забезпечення",
        hidden: true,
      },
      { slug: "territory", title: "Територія обслуговування" },
      {
        slug: "staff",
        title: "Кадровий склад школи та наявні вакансії",
        href: "/school-life#teachers",
      },
      { slug: "programs", title: "Освітні програми", hidden: true },
      { slug: "symbols", title: "Наша символіка" },
      { slug: "bells", title: "Розклад дзвінків", hidden: true },
      { slug: "language", title: "Мова освітнього процесу" },
    ],
  },
  {
    id: "education",
    title: "Організація навчального процесу",
    color: "pink",
    illustration: "book",
    pages: [
      { slug: "new-school", title: "Нова українська школа", hidden: true },
      { slug: "protocols", title: "Протоколи педрад" },
      {
        slug: "certification",
        title: "Атестація педпрацівників",
        hidden: true,
      },
      { slug: "textbooks", title: "Вибір підручників", hidden: true },
      {
        slug: "job-descriptions",
        title: "Посадові інструкції працівників школи",
        hidden: true,
      },
      {
        slug: "work-safety",
        title: "Інструкції з охорони праці",
        hidden: true,
      },
      { slug: "anti-bullying", title: "Антибулінг", hidden: true },
      {
        slug: "self-assessment",
        title: "Самооцінювання діяльності школи",
        hidden: true,
      },
    ],
  },
  {
    id: "transparency",
    title: "Прозорість",
    color: "blue",
    illustration: "archive",
    pages: [
      { slug: "openness", title: "Прозорість та відкритість діяльності" },
      { slug: "statute", title: "Статут школи" },
      { slug: "license", title: "Ліцензія", hidden: true },
      { slug: "admission", title: "Правила прийому учнів" },
      { slug: "inclusive-education", title: "Інклюзивна освіта", hidden: true },
    ],
  },
  {
    id: "students",
    title: "Інформація для учнів",
    color: "green",
    illustration: "pencil",
    hidden: true,
    pages: [],
  },
];

export function publicKnowledgePages() {
  return KNOWLEDGE_GROUPS.filter((group) => !group.hidden).flatMap((group) =>
    group.pages
      .filter((page) => !page.hidden && !page.href)
      .map((page) => ({ group, page })),
  );
}
