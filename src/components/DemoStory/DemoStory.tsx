import Image from "next/image";
import styles from "../../styles/Page.module.scss";
export function DemoStory({
  title,
  eyebrow = "Знайомство",
  reverse = false,
  long = false,
  vertical = false,
}: {
  title: string;
  eyebrow?: string;
  reverse?: boolean;
  long?: boolean;
  vertical?: boolean;
}) {
  return (
    <section
      className={`container section ${styles.story} ${reverse ? styles.reverse : ""}`}
    >
      <figure className={vertical ? styles.verticalPhoto : styles.storyPhoto}>
        <Image
          src={`/images/school-demo-${vertical ? "vertical" : "horizontal"}.jpg`}
          alt="Тимчасове згенероване зображення сільської школи"
          fill
          sizes="(min-width: 768px) 550px, 90vw"
        />
        <figcaption>Демонстраційне зображення</figcaption>
      </figure>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="muted">
          Тут з’явиться розповідь про нашу школу. Поки ми збираємо справжні
          світлини та спогади, цей блок показує майбутній вигляд сторінки.
        </p>
        <p className="muted">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean vitae
          lorem euismod, aliquam erat volutpat.{" "}
          {long &&
            "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Donec a purus vel neque tristique faucibus. Integer dignissim, libero quis tincidunt interdum, erat ipsum cursus mi, vitae faucibus lorem orci sed arcu."}
        </p>
        <span className="badge">Тимчасове наповнення</span>
      </div>
    </section>
  );
}
