"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Illustration } from "@/components/Illustration/Illustration";
import type { KnowledgeGroup } from "@/lib/knowledge";
import styles from "./KnowledgeAccordion.module.scss";

export function KnowledgeAccordion({ groups }: { groups: KnowledgeGroup[] }) {
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const restore = () => {
      const id = window.location.hash.slice(1);
      if (groups.some((group) => group.id === id)) setOpen(id);
    };
    restore();
    window.addEventListener("hashchange", restore);
    return () => window.removeEventListener("hashchange", restore);
  }, [groups]);

  return (
    <div className={styles.groups}>
      {groups.map((group) => {
        const expanded = open === group.id;
        return (
          <section id={group.id} key={group.id} className={`${styles.group} ${styles[group.color]}`}>
            <h2>
              <button
                type="button"
                id={`${group.id}-trigger`}
                aria-expanded={expanded}
                aria-controls={`${group.id}-panel`}
                onClick={() => {
                  setOpen(expanded ? null : group.id);
                  window.history.replaceState(null, "", expanded ? window.location.pathname : `#${group.id}`);
                }}
              >
                <span>{group.title}</span>
                <Illustration kind={group.illustration} />
              </button>
            </h2>
            <div
              id={`${group.id}-panel`}
              role="region"
              aria-labelledby={`${group.id}-trigger`}
              aria-hidden={!expanded}
              inert={!expanded}
              className={`${styles.panel} ${expanded ? styles.expanded : ""}`}
            >
              <div>
                <ul>
                  {group.pages.filter((page) => !page.hidden).map((page) => (
                    <li key={page.slug}>
                      <Link href={page.href ?? `/knowledge/${group.id}/${page.slug}`}>
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
