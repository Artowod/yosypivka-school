import { PageHero } from "@/components/PageHero/PageHero";
import { KnowledgeAccordion } from "@/components/KnowledgeAccordion/KnowledgeAccordion";
import { KNOWLEDGE_GROUPS } from "@/lib/knowledge";

export const metadata = {
  title: "База знань нашого закладу",
  description:
    "Відомості про Йосипівську початкову школу, організація навчального процесу та відкриті документи закладу.",
  alternates: { canonical: "/knowledge" },
};

export default function KnowledgePage() {
  return (
    <>
      <PageHero
        title="База знань нашого закладу"
        description="Знайомтеся зі школою та знаходьте потрібну інформацію й документи в одному місці."
        eyebrow="Школа у відкритому доступі"
        kind="book"
        mood="green"
      />
      <div className="container">
        <KnowledgeAccordion
          groups={KNOWLEDGE_GROUPS.filter((group) => !group.hidden).map(
            (group) => ({
              ...group,
              pages: group.pages.filter((page) => !page.hidden),
            }),
          )}
        />
      </div>
    </>
  );
}
