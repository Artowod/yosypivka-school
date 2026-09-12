"use client";
import { Illustration } from "@/components/Illustration/Illustration";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="uk">
      <body>
        <main>
          <Illustration kind="sunflower" />
          <h1>Упс… не вдалося відкрити школу</h1>
          <p>Щось пішло не за планом. Спробуйте трохи пізніше.</p>
          <button onClick={reset}>Спробувати ще раз</button>
        </main>
      </body>
    </html>
  );
}
