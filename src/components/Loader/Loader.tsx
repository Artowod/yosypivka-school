"use client";
import { useEffect, useState } from "react";
import { Illustration } from "../Illustration/Illustration";
import styles from "../../styles/Feedback.module.scss";
export function Loader({
  label = "Ще мить — і все готово…",
}: {
  label?: string;
}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className={styles.loader} role="status">
      <Illustration kind="pencil" />
      <span>
        {slow
          ? "Упс… поки не завантажилось. Можна зачекати або спробувати пізніше."
          : label}
      </span>
    </div>
  );
}
