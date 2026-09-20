import { LinkIcon } from "@/components/LinkIcon/LinkIcon";
import Image from "next/image";
import Link from "next/link";
import { Illustration } from "@/components/Illustration/Illustration";
import { ClassIllustration } from "@/components/ClassIllustration/ClassIllustration";
import page from "@/styles/Page.module.scss";
import styles from "./Home.module.scss";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Йосипівська початкова школа — маленька школа, великі мрії",
  description:
    "Йосипівська початкова школа Брусилівської громади: класи, розклад занять, шкільне життя, галереї та історія рідного краю.",
  path: "/",
});
export default function HomePage() {
  const moments_titles = [
    "Разом навчаємося",
    "Разом відкриваємо",
    "Разом святкуємо",
  ];
  const moments_descriptions = [
    "Ми разом пізнаємо світ, відкриваємо нові знання та навички.",
    "Разом досліджуємо, експериментуємо і за це отримуємо нагороди.",
    "Ми разом святкуємо досягнення та пам’ятаємо важливі моменти.",
  ];
  return (
    <>
      <section className={`container ${styles.hero}`}>
        <div className={styles.heroCopy}>
          <p className="eyebrow">
            <span className={styles.smallFlag} /> Вчимося. Дружимо. Зростаємо.
          </p>
          <h1>
            Маленька школа.
            <br />
            <span>Великі мрії.</span>
          </h1>
          <p>
            Перші відкриття, справжня дружба та любов до рідного краю. Тут
            починається велика подорож у світ знань.
          </p>
          <div className="actions">
            <Link className="button" href="/school-life">
              Познайомимось ближче <LinkIcon />
            </Link>
            <Link className={styles.textLink} href="#our-classes">
              До наших класів <span>↓</span>
            </Link>
          </div>
          <div className={styles.heroNote}>
            <Illustration kind="sunflower" />
            <span>
              З теплом до кожної дитини.
              <br />
              <b>З любов’ю до України.</b>
            </span>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.photo}>
            <Image
              src="/images/school-main-1.jpg"
              alt="Моя затишна сільська школа"
              fill
              priority
              sizes="(min-width: 768px) 600px, 98vw"
            />
          </div>
          <div className={styles.photoLabel}>
            <span className={styles.pin}>⌖</span>
            <div>
              <b>Наш маленький світ</b>
              <small>Йосипівка · Житомирщина</small>
            </div>
            <Illustration kind="flag" />
          </div>
          <div className={styles.sunDecoration}>
            <Illustration kind="sunflower" />
          </div>
          <div className={styles.bookDecoration}>
            <Illustration kind="book" />
          </div>
          <span className={styles.sparkle}>✧</span>
        </div>
      </section>
      <div className={`container ${styles.values}`}>
        <div>
          <Illustration kind="book" />
          <span>
            <b>Пізнаємо світ</b>
            <small>З цікавістю до нового</small>
          </span>
        </div>
        <div>
          <Illustration kind="sunflower" />
          <span>
            <b>Зростаємо разом</b>
            <small>У колі друзів і підтримки</small>
          </span>
        </div>
        <div>
          <Illustration kind="flag" />
          <span>
            <b>Любимо Україну</b>
            <small>Починаємо з рідного краю</small>
          </span>
        </div>
      </div>
      <section id="our-classes" className="container section">
        <div className={page.sectionTitle}>
          <div>
            <p className="eyebrow">Чотири сходинки до великих відкриттів</p>
            <h2>Кожен клас — маленька родина</h2>
            <p className="muted">
              Зазирніть у наші класи: розклад, світлини та шкільні миті.
            </p>
          </div>
        </div>
        <div className={page.classGrid}>
          {[
            "Перші кроки та відкриття",
            "Щодня дізнаємося більше",
            "Досліджуємо та творимо",
            "Мріємо й рушаємо далі",
          ].map((text, index) => (
            <Link
              className={page.classCard}
              href={`/classes/${index + 1}`}
              key={text}
            >
              <ClassIllustration number={index + 1} />

              <h3>{index + 1} клас</h3>
              <p>{text}</p>
              <div className={styles.classCardLink}>
                <span>Завітати до класу</span>

                <LinkIcon />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className={styles.lifeSection}>
        <div className="container">
          <div className={page.sectionTitle}>
            <div>
              <p className="eyebrow">Зберігаємо теплі моменти</p>
              <h2>Шкільне життя як на долоні</h2>
            </div>
            <Link href="/school-life">
              Усе шкільне життя <LinkIcon />
            </Link>
          </div>
          <div className={styles.lifeGrid}>
            {moments_titles.map((title, index) => (
              <Link
                href={"/school-life/gallery"}
                key={title}
                className={styles.lifeCard}
              >
                <div>
                  <Image
                    src={`/images/school-moments-${index + 1}.jpg`}
                    alt={`Фото ${index + 1} — моменти шкільного життя`}
                    fill
                    sizes="(min-width:768px) 380px, 90vw"
                  />
                </div>
                <section>
                  <p className="eyebrow">Наші шкільні миті</p>
                  <h3>
                    {title} <LinkIcon />
                  </h3>
                  <p>{moments_descriptions[index]}</p>
                </section>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className={`container ${page.callout}`}>
        <Illustration kind="kalyna" />
        <div>
          <h2>Знати своє. Берегти рідне.</h2>
          <p>Дізнайтеся більше про Йосипівку та історію нашого краю.</p>
        </div>
        <Link className="button secondary" href="/history">
          Наша історія <LinkIcon />
        </Link>
      </div>
    </>
  );
}
