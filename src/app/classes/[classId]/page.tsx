import { LinkIcon } from "@/components/LinkIcon/LinkIcon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero/PageHero";
import { DemoStory } from "@/components/DemoStory/DemoStory";
import { ClassSchedule } from "@/components/ClassSchedule/ClassSchedule";
import { Illustration } from "@/components/Illustration/Illustration";
import { getSchedule } from "@/lib/data";
import { weekStart } from "@/lib/dates";
import { CLASS_IDS } from "@/lib/constants";
import { logError } from "@/lib/logging";
import styles from "@/styles/Page.module.scss";
export const revalidate = 60;
export function generateStaticParams() {
  return CLASS_IDS.map((id) => ({ classId: String(id) }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return {
    title: `${classId} клас`,
    description: `Розклад занять, знайомство та галерея ${classId} класу Йосипівської початкової школи.`,
    alternates: { canonical: `/classes/${classId}` },
  };
}
export default async function ClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  if (!["1", "2", "3", "4"].includes(classId)) notFound();
  const id = Number(classId);
  const week = weekStart();
  let schedule;
  try {
    schedule = await getSchedule(id, week);
  } catch (error) {
    await logError("class.schedule", error);
  }
  return (
    <>
      <PageHero
        title={`${id} клас`}
        description="Наша маленька родина: навчаємося, відкриваємо світ і збираємо щасливі спогади."
        eyebrow="Великі відкриття починаються тут"
        classNumber={id}
        mood={id % 2 ? "pink" : "blue"}
      />
      <div className="container section actions">
        <Link className="button" href="#schedule">
          Наш розклад ↓
        </Link>
        <Link className="button secondary" href={`/classes/${id}/gallery`}>
          Галерея класу <LinkIcon />
        </Link>
      </div>
      <DemoStory
        title="Знайомтеся — це ми!"
        eyebrow={`${id} клас · наша спільна історія`}
        long
      />
      {schedule ? (
        <ClassSchedule classId={id} initialWeek={week} initialData={schedule} />
      ) : (
        <section id="schedule" className="container empty">
          <Illustration kind="sunflower" />
          <h2>Розклад трішки затримується</h2>
          <p>Завітайте, будь ласка, пізніше.</p>
        </section>
      )}
      <DemoStory
        title="Кожен день — нова пригода"
        eyebrow="Навчання, творчість і дружба"
        reverse
      />
      <div className={`container ${styles.callout}`}>
        <Illustration kind="camera" />
        <div>
          <h2>Наші миті в об’єктиві</h2>
          <p>Уроки, свята й маленькі щоденні відкриття.</p>
        </div>
        <Link className="button" href={`/classes/${id}/gallery`}>
          Відкрити галерею <LinkIcon />
        </Link>
      </div>
    </>
  );
}
