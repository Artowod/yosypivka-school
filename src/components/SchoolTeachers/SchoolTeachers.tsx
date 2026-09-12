import Image from "next/image";
import { TEACHERS, TEAM_PHOTO } from "@/content/teachers";
import { KNOWLEDGE_CONTENT } from "@/content/knowledge";
import { Illustration } from "@/components/Illustration/Illustration";
import styles from "./SchoolTeachers.module.scss";

export function SchoolTeachers() {
  return <section id="teachers" className={`container section ${styles.team}`}>
    <p className="eyebrow">Поруч із дітьми</p>
    <h2>Наші вчителі</h2>
    <div className={styles.teamPhoto}><Image src={TEAM_PHOTO} alt="Педагогічний колектив Йосипівської початкової школи" width={1280} height={850} sizes="(min-width: 1000px) 900px, 90vw" /></div>
    <div className={styles.people}>
      {TEACHERS.map((teacher) => <article key={teacher.name}>
        {teacher.photo ? <div className={styles.photo}><Image src={teacher.photo} alt={teacher.name} width={700} height={900} sizes="(min-width: 1000px) 330px, (min-width: 600px) 44vw, 85vw" /></div> : <div className={styles.placeholder}><Illustration kind="book" /></div>}
        <h3>{teacher.name}</h3><p>{teacher.description}</p>
      </article>)}
    </div>
    <p className={styles.source}>Відомості про педагогів та стаж — за <a href={KNOWLEDGE_CONTENT.staff.source} target="_blank" rel="noreferrer">публікацією шкільного сайту</a>.</p>
  </section>;
}
