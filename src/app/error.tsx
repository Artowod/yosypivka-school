"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Illustration } from "@/components/Illustration/Illustration";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page rendering failed", { digest: error.digest });
  }, [error]);
  return (
    <section className="container section empty">
      <Illustration kind="sunflower" />
      <h1>Упс… сторінка заблукала</h1>
      <p>Щось пішло не за планом. Спробуйте трохи пізніше.</p>
      <div className="actions">
        <button onClick={reset}>Спробувати ще раз</button>
        <Link className="button secondary" href="/">
          На головну
        </Link>
      </div>
    </section>
  );
}
