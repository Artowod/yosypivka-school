import Link from "next/link";
import { notFound } from "next/navigation";
import { Illustration } from "@/components/Illustration/Illustration";
import { KnowledgeMaterials } from "@/components/KnowledgeMaterials/KnowledgeMaterials";
import { KNOWLEDGE_CONTENT } from "@/content/knowledge";
import { publicKnowledgePages, type KnowledgeContent } from "@/lib/knowledge";
import styles from "../../Knowledge.module.scss";

// Only published paths from generateStaticParams are routable. Reject other
// paths before streaming starts so they return HTTP 404 rather than a soft 404.
export const dynamicParams = false;
type Props = { params: Promise<{ group: string; slug: string }> };
const pages = publicKnowledgePages();
function resolve(group: string, slug: string) {
  return pages.find(
    (entry) => entry.group.id === group && entry.page.slug === slug,
  );
}
export function generateStaticParams() {
  return pages.map(({ group, page }) => ({ group: group.id, slug: page.slug }));
}
export async function generateMetadata({ params }: Props) {
  const { group, slug } = await params;
  const entry = resolve(group, slug);
  if (!entry) return { title: "Сторінку не знайдено" };
  return {
    title: entry.page.title,
    description: `${entry.page.title}. ${entry.group.title} — база знань Йосипівської початкової школи.`,
    alternates: { canonical: `/knowledge/${group}/${slug}` },
  };
}
export default async function KnowledgeArticle({ params }: Props) {
  const { group, slug } = await params;
  const entry = resolve(group, slug);
  if (!entry) notFound();
  const content: KnowledgeContent =
    KNOWLEDGE_CONTENT[slug as keyof typeof KNOWLEDGE_CONTENT];
  return (
    <div className={`container ${styles.article}`}>
      <Link className={styles.back} href={`/knowledge#${group}`}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="m10 5-7 7 7 7M3 12h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Назад до розділів
      </Link>
      <nav aria-label="Навігаційний шлях" className={styles.breadcrumb}>
        <Link href="/">Головна</Link>
        <span aria-hidden="true">/</span>
        <Link href="/knowledge">База знань нашого закладу</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/knowledge#${group}`}>{entry.group.title}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{entry.page.title}</span>
      </nav>
      <header className={`${styles.title} ${styles[entry.group.color]}`}>
        <> {console.log("entry", entry.group.color)}</>
        <h1>{entry.page.title}</h1>
        <Illustration kind={entry.group.illustration} />
      </header>
      <article className={styles.body}>
        {content.blocks.map((block, index) =>
          block.type === "h2" ? (
            <h2 key={index}>{block.text}</h2>
          ) : block.type === "p" ? (
            <p
              key={index}
              className={`${block?.color_symbolic_cube ? styles.color_cube_wrapper : ""}`}
            >
              {block?.color_symbolic_cube && (
                <span
                  className={`${styles.color_cube} ${
                    styles[block.color_symbolic_cube]
                  }`}
                ></span>
              )}
              {block.text}
            </p>
          ) : null,
        )}
        <KnowledgeMaterials materials={content.materials} />
      </article>
    </div>
  );
}
