import { ClassIllustration } from "../ClassIllustration/ClassIllustration";
import Link from "next/link";
import {
  Illustration,
  type IllustrationKind,
} from "../Illustration/Illustration";
import styles from "../../styles/Page.module.scss";
export function PageHero({
  title,
  description,
  eyebrow,
  kind = "book",
  classNumber,
  mood = "blue",
}: {
  title: string;
  description: string;
  eyebrow: string;
  kind?: IllustrationKind;
  classNumber?: number;
  mood?: "blue" | "pink" | "paper" | "green";
}) {
  return (
    <div className={`container ${styles.pageHero} ${styles[mood]}`}>
      <div className={styles.breadcrumb}>
        <Link href="/">Головна</Link>
        <span> / </span>
        <span>{title}</span>
      </div>
      <div className={styles.pageHeroInner}>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {classNumber ? (
          <ClassIllustration number={classNumber} />
        ) : (
          <Illustration kind={kind} />
        )}
      </div>
      <div className={styles.heroDecor}>
        <Illustration kind="kalyna" />
        <Illustration kind="flag" />
      </div>
    </div>
  );
}
