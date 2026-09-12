import { SchoolHistory } from "@/components/SchoolHistory/SchoolHistory";
import { LinkIcon } from "@/components/LinkIcon/LinkIcon";
import { PageHero } from "@/components/PageHero/PageHero";
import { Illustration } from "@/components/Illustration/Illustration";
import styles from "@/styles/Page.module.scss";
const PLAN =
  "https://oda.ztmbk.gov.ua/upload/docs/gen-plany/50/2020-12-03/1204296_1606989712.pdf";
export const metadata = {
  title: "Історія нашої школи та села",
  description:
    "Перевірені відомості про Йосипівку, Брусилівський край та місцеву початкову школу з посиланнями на відкриті джерела.",
  alternates: { canonical: "/history" },
};
export default function HistoryPage() {
  return (
    <>
      <PageHero
        title="Історія нашого краю"
        description="Пам’ятаємо своє коріння. Збираємо історію Йосипівки, рідного краю та нашої школи."
        eyebrow="Село · громада · школа"
        kind="archive"
        mood="paper"
      />
      <section className={`container ${styles.history}`}>
        <p className="eyebrow">Йосипівка на Житомирщині</p>
        <h2>Сторінки, з яких починається пам’ять</h2>
        <p>
          Сьогодні Йосипівська початкова школа належить до Брусилівської
          селищної громади Житомирського району. У документах попередніх років
          село зазначене як частина Брусилівського району. Такі назви на цій
          сторінці збережені в контексті відповідного часу.{" "}
          <a
            href="https://zt.isuo.org/schools/view/id/15639"
            target="_blank"
            rel="noreferrer"
          >
            Відомості ІСУО <LinkIcon />
          </a>
        </p>
        <div className={styles.timeline}>
          <article>
            <strong>1763</strong>
            <h3>Перша згадка в історичній довідці</h3>
            <p>
              Генеральний план Йосипівки, підготовлений 2019 року, датує першу
              згадку села 1763 роком і пов’язує її з поселенням польської
              шляхти. У довідці назву села пояснено іменем його власника Йосифа
              Дев’ятковського. Це переказ відомостей містобудівного документа, а
              не самостійно перевіреного архівного запису.
            </p>
            <a href={`${PLAN}#page=11`} target="_blank" rel="noreferrer">
              Генеральний план, сторінка 11 <LinkIcon />
            </a>
          </article>
          <article>
            <strong>1946</strong>
            <h3>Від Юзефівки до Йосипівки</h3>
            <p>
              За тією ж історичною довідкою, до 7 червня 1946 року село мало
              назву Юзефівка.
            </p>
            <a href={`${PLAN}#page=11`} target="_blank" rel="noreferrer">
              Джерело відомостей <LinkIcon />
            </a>
          </article>
          <article>
            <strong>2019</strong>
            <h3>Село та його повсякденне життя</h3>
            <p>
              У генеральному плані 2019 року згадано школу й будинок культури.
              Документ описує розташування села біля траси Київ — Чоп та
              відносить його територію до Житомирського Полісся, зони мішаних
              лісів.
            </p>
            <a href={`${PLAN}#page=12`} target="_blank" rel="noreferrer">
              Географія та історична довідка <LinkIcon />
            </a>
          </article>
          <article>
            <strong>Наша школа</strong>
            <h3>Йосипівська початкова школа</h3>
            <p>
              Освітній реєстр ІСУО містить Йосипівську початкову школу
              Брусилівської селищної ради під номером 15639. Заклад позначено як
              комунальну початкову школу в сільській місцевості. Адреса в
              реєстрі: село Йосипівка, вулиця М. Стахівської, 35.
            </p>
            <p>
              Школа також є у списку закладів відділу освіти та спорту
              Брусилівської селищної ради в державній системі АІКОМ.
            </p>
            <a
              href="https://zt.isuo.org/schools/view/id/15639"
              target="_blank"
              rel="noreferrer"
            >
              ІСУО <LinkIcon />
            </a>
            {" · "}
            <a
              href="https://aikom.iea.gov.ua/authority/zzso-list?authorityId=796&sort=full_name"
              target="_blank"
              rel="noreferrer"
            >
              АІКОМ <LinkIcon />
            </a>
          </article>
        </div>
      </section>
      <SchoolHistory />
      <div className={`container ${styles.callout}`}>
        <Illustration kind="book" />
        <div>
          <h2>Історія, яку ми допишемо разом</h2>
          <p>
            Спогади вчителів, архівні світлини та історії випусків допоможуть
            доповнити шкільний літопис. Збираємо підтверджені матеріали
            та зберігаємо пам’ять про кожне покоління.
          </p>
        </div>
      </div>
      <p className="container muted">
        Джерела перевірено 5 вересня 2026 року. Історична довідка генерального
        плану відображає відомості станом на 2019 рік.
      </p>
    </>
  );
}
