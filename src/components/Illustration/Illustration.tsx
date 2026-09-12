import styles from "./Illustration.module.scss";
export type IllustrationKind =
  | "school"
  | "book"
  | "pencil"
  | "sunflower"
  | "camera"
  | "archive"
  | "flag"
  | "kalyna"
  | "trident";
export function Illustration({
  kind = "book",
  className = "",
}: {
  kind?: IllustrationKind;
  className?: string;
}) {
  return (
    <svg
      className={`${styles.icon} ${className}`}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      {kind === "school" ? (
        <>
          <path d="M14 45h72v43H14z" fill="#f5dfa1" />
          <path
            d="M8 46 50 14l42 32"
            fill="#85b4bd"
            stroke="#477c8b"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M40 60h20v28H40z" fill="#5f9b95" />
          <path d="M23 56h10v13H23zm44 0h10v13H67z" fill="#eef8ef" />
          <path d="M50 14V3" stroke="#57787d" strokeWidth="3" />
          <path d="M52 3h20v6H52z" fill="#68a6d1" />
          <path d="M52 9h20v6H52z" fill="#f5ce56" />
          <circle cx="50" cy="44" r="9" fill="#fffdf4" />
          <path d="M50 39v6l4 2" stroke="#57787d" strokeWidth="2" />
          <path
            d="M6 89h88"
            stroke="#8fac7f"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : kind === "sunflower" ? (
        <>
          <path d="M50 55v40" stroke="#63916a" strokeWidth="6" />
          <path
            d="M50 82Q18 85 22 65q23-1 28 17Zm0 8q30 0 28-22-22 1-28 22"
            fill="#8fb878"
          />
          <g className={styles.moving}>
            {Array.from({ length: 10 }, (_, i) => (
              <ellipse
                key={i}
                cx="50"
                cy="21"
                rx="10"
                ry="19"
                fill={i % 2 ? "#f2bc42" : "#f6d86c"}
                transform={`rotate(${i * 36} 50 42)`}
              />
            ))}
            <circle cx="50" cy="42" r="20" fill="#8c6542" />
            <circle cx="44" cy="39" r="2" fill="#fff1b9" />
            <circle cx="56" cy="39" r="2" fill="#fff1b9" />
            <path
              d="M43 48q7 6 14 0"
              stroke="#fff1b9"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </>
      ) : kind === "camera" ? (
        <>
          <path d="m33 27 8-12h23l7 12" fill="#f2cf68" />
          <rect x="10" y="26" width="80" height="58" rx="14" fill="#8bb5bb" />
          <path d="M10 42h80v15H10" fill="#aed0d1" />
          <g className={styles.moving}>
            <circle cx="50" cy="54" r="23" fill="#ffefc1" />
            <circle cx="50" cy="54" r="16" fill="#487b89" />
            <circle cx="45" cy="49" r="5" fill="#bde1e4" />
          </g>
          <rect x="74" y="34" width="9" height="6" rx="2" fill="#fff7e1" />
          <path
            d="m19 11 3 8m-13-1 7 4"
            stroke="#d9a356"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : kind === "flag" ? (
        <>
          <path
            d="M22 12v79"
            stroke="#778d8a"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <g className={styles.moving}>
            <path
              d="M25 14q17-9 31 0t30 0v23q-16 9-30 0t-31 0"
              fill="#70b2d9"
            />
            <path
              d="M25 37q17-9 31 0t30 0v23q-16 9-30 0t-31 0"
              fill="#f4d366"
            />
          </g>
          <path
            d="M10 92h25"
            stroke="#95ae85"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : kind === "trident" ? (
        <>
          <path d="M19 9h62v52q0 22-31 33-31-11-31-33Z" fill="#699fc2" />
          <path
            d="M50 20v52m0-40-7 18 7 11 7-11-7-18M32 29v27q0 11 18 16 18-5 18-16V29l-9 8v21H41V37Z"
            stroke="#ffdc71"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      ) : kind === "kalyna" ? (
        <>
          <path
            d="m24 93 38-68m-18 33L21 32m30 14 30-8"
            stroke="#7c9666"
            strokeWidth="4"
          />
          <path
            d="M47 55Q9 67 12 40q22-2 35 15m8-26q-14-29 5-27 12 10-5 27"
            fill="#98b780"
          />
          {[
            [67, 28],
            [81, 28],
            [73, 42],
            [86, 42],
            [65, 55],
            [81, 56],
            [58, 15],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="9"
              fill={i % 2 ? "#d87b7d" : "#c65e66"}
            />
          ))}
        </>
      ) : kind === "archive" ? (
        <>
          <path d="M14 35h73v53H14z" fill="#d3ad79" />
          <path d="M9 25h82v18H9z" fill="#ecd4a8" />
          <rect x="35" y="52" width="32" height="16" rx="4" fill="#fff6da" />
          <path d="M42 60h18" stroke="#aa8a62" strokeWidth="3" />
          <path d="m25 24-4-15 44-6 3 21" fill="#a7c9d2" />
          <path d="m39 24 3-14 37 8-2 6" fill="#f1b8ba" />
        </>
      ) : (
        <>
          <path
            d="M17 18q21-4 33 7 14-11 34-7v62q-18-5-34 6-17-11-33-6Z"
            fill={kind === "pencil" ? "#f9e0b1" : "#91bbd0"}
            stroke="#6594a8"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M50 27v55" stroke="#fff6dc" strokeWidth="3" />
          <path
            d="m25 36 17 3m-17 9 17 3m-17 9 17 3m18-24 15-3m-15 15 15-3m-15 15 15-3"
            stroke="#f3fbfa"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <g className={styles.moving}>
            <path d="m67 8 10 5-24 46-12 10 2-16Z" fill="#f1cd69" />
            <path d="m67 8 10 5-5 9-10-5" fill="#d899a2" />
            <path d="m43 53 10 6-12 10" fill="#f5e6c7" />
            <path d="m41 69 2-7 4 3" fill="#506d67" />
          </g>
        </>
      )}
    </svg>
  );
}
