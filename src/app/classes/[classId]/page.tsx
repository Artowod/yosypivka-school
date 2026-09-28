import { LinkIcon } from "@/components/LinkIcon/LinkIcon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero/PageHero";
import { DemoStory } from "@/components/DemoStory/DemoStory";
import { ClassSchedule } from "@/components/ClassSchedule/ClassSchedule";
import { Illustration } from "@/components/Illustration/Illustration";
import { getSchedule } from "@/lib/data";
import { CLASS_IDS } from "@/lib/constants";
import { logError } from "@/lib/logging";
import { createPageMetadata } from "@/lib/seo";
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
  if (!CLASS_IDS.includes(Number(classId) as (typeof CLASS_IDS)[number])) {
    return { title: "Сторінку не знайдено", robots: { index: false } };
  }
  return createPageMetadata({
    title: `${classId} клас`,
    description: `Розклад занять, знайомство та галерея ${classId} класу Йосипівської початкової школи.`,
    path: `/classes/${classId}`,
  });
}

const CLASS_DESCRIPTIONS: Record<string, string> = {
  "1": "Ми - Першачки Йосипівської початкової школи 2026 року. Перший клас - це початок великої подорожі у світ знань. Разом навчаємося, відкриваємо світ і збираємо щасливі спогади. Ми - маленька родина, де кожен день приносить нові відкриття та радість від спільних досягнень.",
  "2": "Другий клас — це час для нових відкриттів та дружніх пригод. Ми разом досліджуємо світ, розвиваємо навички та святкуємо досягнення.",
  "3": "Третій клас — це етап, коли ми стаємо більш самостійними та впевненими. Разом ми вчимося, творимо та підтримуємо один одного.",
  "4": "Четвертий клас — це час підготовки до нових викликів та великих звершень. Ми разом навчаємося, відкриваємо світ і збираємо щасливі спогади",
};
const CLASS_PHOTO_MAIN_SIZES: Record<
  string,
  { width: number; height: number }
> = {
  "1": { width: 1379, height: 845 },
  "2": { width: 949, height: 720 },
  "3": { width: 949, height: 720 },
  "4": { width: 949, height: 720 },
};

const CLASS_PHOTO_LIFE_SIZES: Record<
  string,
  { width: number; height: number }
> = {
  "1": { width: 949, height: 720 },
  "2": { width: 949, height: 720 },
  "3": { width: 949, height: 720 },
  "4": { width: 949, height: 720 },
};

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  if (!["1", "2", "3", "4"].includes(classId)) notFound();
  const id = Number(classId);
  let schedule;
  try {
    schedule = await getSchedule(id);
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
        img={`/images/school-${id}-class-main.jpg`}
        description={CLASS_DESCRIPTIONS[classId]}
        imageWidth={CLASS_PHOTO_MAIN_SIZES[classId].width}
        imageHeight={CLASS_PHOTO_MAIN_SIZES[classId].height}
      />
      {schedule ? (
        <ClassSchedule classId={id} initialData={schedule} />
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
        img={`/images/school-${id}-class-life.jpg`}
        imageWidth={CLASS_PHOTO_LIFE_SIZES[classId].width}
        imageHeight={CLASS_PHOTO_LIFE_SIZES[classId].height}
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
