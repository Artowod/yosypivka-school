import styles from "./ClassIllustration.module.scss";
export function ClassIllustration({ number }: { number: number }) {
  return (
    <svg
      className={styles.classIcon}
      viewBox="0 0 120 110"
      role="img"
      aria-label={`${number} клас`}
    >
      <rect
        x="8"
        y="9"
        width="94"
        height="94"
        rx="30"
        fill={["#f6df8e", "#b7dce5", "#f0c6cb", "#c4dbc0"][number - 1]}
        transform="rotate(-6 55 55)"
      />
      <text
        x="56"
        y="79"
        textAnchor="middle"
        fontSize="75"
        fontWeight="900"
        fill={["#9a7122", "#42849d", "#ab5b73", "#537d50"][number - 1]}
      >
        {number}
      </text>
      <path d="m93 3 3 9 9 3-9 3-3 9-3-9-9-3 9-3" fill="#eab653" />
      <circle cx="18" cy="89" r="8" fill="#92b8bc" />
    </svg>
  );
}
