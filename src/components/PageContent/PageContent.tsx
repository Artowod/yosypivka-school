"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import styles from "./PageContent.module.scss";

export function PageContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  return (
    <main
      id="main-content"
      key={pathname}
      className={isAdmin ? undefined : styles.content}
    >
      {children}
    </main>
  );
}
