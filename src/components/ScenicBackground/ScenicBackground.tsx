import Image from "next/image";
import styles from "./ScenicBackground.module.scss";
const SCENES = ["sunflowers", "sky", "forest", "flag"];
export function ScenicBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      {SCENES.map((scene, index) => (
        <div className={styles.scene} key={scene}>
          <Image
            src={`/images/backgrounds/${scene}.webp`}
            alt=""
            fill
            sizes="100vw"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}
