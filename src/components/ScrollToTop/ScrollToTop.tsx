"use client";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import styles from "./ScrollToTop.module.scss";
function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}
const getSnapshot = () => window.scrollY > window.innerHeight;
const getServerSnapshot = () => false;
export function ScrollToTop() {
  const pathname = usePathname();
  const visible = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return (
    <button
      type="button"
      className={`${styles.button} ${visible ? styles.visible : ""}`}
      aria-label="Прокрутити на початок сторінки"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      title="Нагору"
      onClick={() =>
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        })
      }
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 19V5m-6 6 6-6 6 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
