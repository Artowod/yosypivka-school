import { LinkIcon } from "@/components/LinkIcon/LinkIcon";
import Link from "next/link";
import { Illustration } from "../Illustration/Illustration";
import styles from "../../styles/Page.module.scss";
export function SchoolFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerGrid}`}>
        <div>
          <div className={styles.footerBrand}>
            <Illustration kind="school" />
            <strong>
              Йосипівська
              <br />
              початкова школа
            </strong>
          </div>
          <p>
            Місце, де починається любов
            <br />
            до знань, до людей, до України.
          </p>
          <div className={styles.footerSymbols}>
            <Illustration kind="trident" />
            <Illustration kind="flag" />
            <Illustration kind="kalyna" />
          </div>
        </div>
        <div>
          <h3>Знайомтеся зі школою</h3>
          <Link href="/history">Наша історія</Link>
          <Link href="/school-life">Шкільне життя</Link>
          <Link href="/archive">Фотоархів</Link>
          <Link href="/knowledge">База знань нашого закладу</Link>
        </div>
        <div>
          <h3>Наші класи</h3>
          {[1, 2, 3, 4].map((id) => (
            <Link key={id} href={`/classes/${id}`}>
              {id} клас
            </Link>
          ))}
        </div>
        <div>
          <h3>Наша громада</h3>
          <p>
            село Йосипівка
            <br />
            Брусилівська громада
            <br />
            Житомирська область
          </p>
          <a
            href="https://brusylivska-gromada.gov.ua/"
            target="_blank"
            rel="noreferrer"
          >
            Сайт громади <LinkIcon />
          </a>
          <p className="muted">
            Соціальні сторінки школи
            <br />
            з’являться тут згодом.
          </p>
        </div>
      </div>
      <div className={`container ${styles.footerBottom}`}>
        <span>Йосипівська початкова школа</span>
        <span>
          З турботою про маленькі великі мрії <span aria-hidden="true">♡</span>
        </span>
      </div>
    </footer>
  );
}
