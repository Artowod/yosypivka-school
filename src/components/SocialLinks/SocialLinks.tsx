import { LinkIcon } from "@/components/LinkIcon/LinkIcon";
import { SOCIAL_LINKS } from "@/lib/site";
import styles from "../SchoolHeader/SchoolHeader.module.scss";
export function SocialLinks() {
  return (
    <details className={styles.social}>
      <summary aria-label="Соціальні сторінки школи">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="1" y="1" width="22" height="22" rx="7" fill="#83aabb" />
          <path
            d="M14 21v-8h3l.5-3H14V8c0-1 .5-1.5 1.5-1.5H18V4h-3c-3 0-4 2-4 4v2H9v3h2v8"
            fill="#fffdf4"
          />
        </svg>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="6"
            stroke="#c58c9b"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r="4.5"
            stroke="#c58c9b"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="18" cy="6" r="1.3" fill="#c58c9b" />
        </svg>
      </summary>
      <div>
        {SOCIAL_LINKS.length ? (
          SOCIAL_LINKS.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
              {link.name} <LinkIcon />
            </a>
          ))
        ) : (
          <p>Наші соціальні сторінки з’являться тут згодом.</p>
        )}
      </div>
    </details>
  );
}
