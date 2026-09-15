"use client";
import { LinkIcon } from "@/components/LinkIcon/LinkIcon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { signOut } from "next-auth/react";
import { useViewer, useToast } from "../Providers/Providers";
import { WeatherWidget } from "../WeatherWidget/WeatherWidget";
import { SocialLinks } from "../SocialLinks/SocialLinks";
import { Illustration } from "../Illustration/Illustration";
import { FRIENDLY_ERROR } from "@/lib/constants";
import styles from "./SchoolHeader.module.scss";
import Image from "next/image";
import school_base_icon from "./knowledge_base_icon.png";

const LINKS = [
  ["/", "Головна"],
  ["/history", "Наша історія"],
  ["/school-life", "Шкільне життя"],
  ["/archive", "Фотоархів"],
];
export function SchoolHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const avatarCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    const frame = requestAnimationFrame(() => {
      if (!window.location.hash)
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => {
      const nav = header.querySelector("nav");
      const upperHeight =
        window.innerWidth >= 768
          ? nav?.offsetTop ?? 0
          : header.firstElementChild?.getBoundingClientRect().height ?? 0;
      header.style.setProperty("--header-offset", `${upperHeight}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    return () => observer.disconnect();
  }, []);
  const [menu, setMenu] = useState(false);
  const viewer = useViewer();
  const toast = useToast();
  const actor = viewer.data?.actor;
  const roleLabel = actor
    ? [
        ...(actor.roles.includes("admin") ? ["Адмін"] : []),
        ...actor.roles
          .filter((role) => role.startsWith("class_"))
          .sort()
          .map((role) => `Вчитель ${role.slice(-1)} класу`),
      ].join(" · ") || "Гість"
    : null;
  useEffect(() => {
    const closeOutside = (event: PointerEvent) =>
      document
        .querySelectorAll<HTMLDetailsElement>("header details[open]")
        .forEach((details) => {
          if (event.target instanceof Node && !details.contains(event.target))
            details.open = false;
        });
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape")
        document
          .querySelectorAll<HTMLDetailsElement>("header details[open]")
          .forEach((details) => {
            details.open = false;
            details.querySelector("summary")?.focus();
          });
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
      if (avatarCloseTimer.current) clearTimeout(avatarCloseTimer.current);
    };
  }, []);
  return (
    <header ref={headerRef} className={styles.header}>
      <div className={styles.topline}>
        <div className="container">
          <span>Брусилівська громада · Житомирщина</span>
          {roleLabel ? (
            <span className={styles.roleStatus} title={roleLabel}>
              Статус: <strong>{roleLabel}</strong>
            </span>
          ) : (
            <span className={styles.toplineMessage}>
              Зростаємо разом. З любов’ю до України{" "}
              <span className={styles.flag} />
            </span>
          )}
        </div>
      </div>
      <div className={`container ${styles.main}`}>
        <Link
          className={styles.brand}
          href="/"
          aria-label="Йосипівська початкова школа — головна"
        >
          <Illustration kind="school" />
          <span>
            Йосипівська<span>початкова школа</span>
          </span>
        </Link>
        <div className={styles.tools}>
          <WeatherWidget />
          <SocialLinks />
          <span className={styles.divider} />
          {actor ? (
            <>
              <details
                className={styles.avatar}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return;
                  if (avatarCloseTimer.current)
                    clearTimeout(avatarCloseTimer.current);
                  avatarCloseTimer.current = null;
                  event.currentTarget.open = true;
                }}
                onPointerLeave={(event) => {
                  if (
                    event.pointerType === "mouse" &&
                    !event.currentTarget.contains(document.activeElement)
                  ) {
                    const avatar = event.currentTarget;
                    if (avatarCloseTimer.current)
                      clearTimeout(avatarCloseTimer.current);
                    avatarCloseTimer.current = setTimeout(() => {
                      avatar.open = false;
                      avatarCloseTimer.current = null;
                    }, 250);
                  }
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    event.currentTarget.open = false;
                }}
              >
                <summary aria-label="Мій профіль">
                  {(actor.name ?? actor.email).charAt(0).toUpperCase()}
                </summary>
                <div>
                  {(actor.name || actor.surname) && (
                    <b>
                      {actor.name} {actor.surname}
                    </b>
                  )}
                  <span>{actor.email}</span>
                  <span className={styles.profileRole}>Статус: {roleLabel}</span>
                  <button
                    className="secondary"
                    onClick={async () => {
                      try {
                        await signOut({ callbackUrl: "/" });
                      } catch {
                        toast(FRIENDLY_ERROR, true);
                      }
                    }}
                  >
                    Вийти
                  </button>
                </div>
              </details>
              {actor.roles.includes("admin") && (
                <Link className={styles.adminLink} href="/admin">
                  Адмін-кабінет
                </Link>
              )}
            </>
          ) : (
            <Link className={styles.login} href="/login">
              <LinkIcon /> Увійти
            </Link>
          )}
          <button
            className={styles.menuButton}
            aria-expanded={menu}
            aria-controls="site-navigation"
            aria-label={menu ? "Закрити меню" : "Відкрити меню"}
            onClick={() => setMenu(!menu)}
          >
            {menu ? "×" : "☰"}
          </button>
        </div>
      </div>
      <nav
        id="site-navigation"
        aria-label="Основна навігація"
        className={`${styles.navigation} ${menu ? styles.open : ""}`}
      >
        <div className="container">
          {LINKS.slice(0, 3).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setMenu(false)}
            >
              {label}
            </Link>
          ))}
          <details className={styles.classesMenu}>
            <summary
              className={pathname.startsWith("/classes") ? styles.active : ""}
            >
              Наші класи{" "}
              <svg
                className={styles.chevron}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <div>
              {[1, 2, 3, 4].map((id) => (
                <Link
                  key={id}
                  href={`/classes/${id}`}
                  onClick={(event) => {
                    setMenu(false);
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open");
                  }}
                >
                  {id} клас
                </Link>
              ))}
            </div>
          </details>
          <Link
            href="/archive"
            aria-current={pathname === "/archive" ? "page" : undefined}
            onClick={() => setMenu(false)}
          >
            Фотоархів
          </Link>
          <Link
            href="/knowledge"
            aria-current={
              pathname.startsWith("/knowledge") ? "page" : undefined
            }
            onClick={() => setMenu(false)}
            className={styles.knowledgeIconWrapper}
            style={{ padding: "0 14px" }}
          >
            <span>База знань нашого закладу</span>
            <Image src={school_base_icon} alt="" width={44} height={44} />
          </Link>
          <span className={styles.navNote}>
            Маленька школа — великі мрії <Illustration kind="sunflower" />
          </span>
        </div>
      </nav>
    </header>
  );
}
