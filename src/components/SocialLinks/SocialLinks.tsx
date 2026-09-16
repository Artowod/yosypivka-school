import styles from "../SchoolHeader/SchoolHeader.module.scss";
export function SocialLinks() {
  return (
    <a
      className={styles.social}
      href="https://www.facebook.com/yosipivska"
      target="_blank"
      rel="noreferrer"
      aria-label="Facebook Йосипівської початкової школи"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1" y="1" width="22" height="22" rx="7" fill="#3079d8" />
        <path
          d="M14 21v-8h3l.5-3H14V8c0-1 .5-1.5 1.5-1.5H18V4h-3c-3 0-4 2-4 4v2H9v3h2v8"
          fill="#fffdf4"
        />
      </svg>
    </a>
  );
}
