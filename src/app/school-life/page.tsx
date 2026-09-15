import { LinkIcon } from "@/components/LinkIcon/LinkIcon";
import Link from "next/link";
import { SchoolTeachers } from "@/components/SchoolTeachers/SchoolTeachers";
import { PageHero } from "@/components/PageHero/PageHero";
import { DemoStory } from "@/components/DemoStory/DemoStory";
import { Illustration } from "@/components/Illustration/Illustration";
import styles from "@/styles/Page.module.scss";
import schoolLifePhoto from "../../../public/images/school-life-1.jpg";
export const metadata = {
  title: "Шкільне життя",
  description:
    "Знайомство зі школою, вчителями, шкільними активностями та випусками Йосипівської початкової школи.",
  alternates: { canonical: "/school-life" },
};
export default function SchoolLifePage() {
  return (
    <>
      <PageHero
        title="Шкільне життя"
        description="Навчання, спільні відкриття та люди, які роблять шкільні роки особливими."
        eyebrow="Більше, ніж уроки"
        kind="school"
        mood="green"
      />
      <DemoStory
        title="Разом творимо нашу школу"
        eyebrow="Дні, наповнені сенсом"
        description="Ми разом навчаємося, відкриваємо нові знання та святкуємо досягнення."
        img={schoolLifePhoto}
        imageAlt="Учні та вчителі Йосипівської початкової школи"
      />
      <SchoolTeachers />
      <DemoStory
        title="Наші випуски"
        eyebrow="Пам’ятаємо кожну маленьку історію"
        reverse
        description="Наші випускники — це частина великої шкільної родини. Ми пам’ятаємо кожну маленьку історію та святкуємо разом."
      />
      <div className={`container ${styles.callout}`}>
        <Illustration kind="camera" />
        <div>
          <h2>Зазирніть у шкільний альбом</h2>
          <p>Спільні справи, свята та теплі зустрічі.</p>
        </div>
        <Link className="button" href="/school-life/gallery">
          Галерея школи <LinkIcon />
        </Link>
      </div>
    </>
  );
}
