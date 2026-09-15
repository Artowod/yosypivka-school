import Image from "next/image";
import type { StaticImageData } from "next/image";
import styles from "@/styles/Page.module.scss";
export function DemoStory({
  title,
  eyebrow = "Знайомство",
  reverse = false,
  description = "Тут з’явиться розповідь. Поки ми готуємо її.",
  vertical = false,
  img,
  imageAlt,
  imageWidth = 1379,
  imageHeight = 845,
}: {
  title: string;
  eyebrow?: string;
  reverse?: boolean;
  long?: boolean;
  description?: string;
  vertical?: boolean;
  img?: string | StaticImageData;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
}) {
  return (
    <section
      className={`container section ${styles.story} ${
        reverse ? styles.reverse : ""
      }`}
    >
      <figure className={vertical ? styles.verticalPhoto : styles.storyPhoto}>
        {typeof img === "string" ? (
          <Image
            src={img}
            alt={imageAlt ?? title}
            className={styles.storyImage}
            width={imageWidth}
            height={imageHeight}
            quality={90}
            sizes="(min-width: 1024px) 66vw, (min-width: 768px) 50vw, calc(100vw - 36px)"
          />
        ) : img ? (
          <Image
            src={img}
            alt={imageAlt ?? title}
            className={styles.storyImage}
            quality={90}
            sizes="(min-width: 1024px) 66vw, (min-width: 768px) 50vw, calc(100vw - 36px)"
          />
        ) : (
          <div className={styles.emptyImgFrame}>місце для фото</div>
        )}
      </figure>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>

        <p className="muted">{description}</p>
      </div>
    </section>
  );
}
