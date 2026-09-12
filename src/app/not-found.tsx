import { LinkIcon } from "@/components/LinkIcon/LinkIcon";
import Link from "next/link";
import { Illustration } from "@/components/Illustration/Illustration";
export default function NotFound() {
  return (
    <section className="container section empty">
      <Illustration kind="book" />
      <h1>Такої сторінки ще немає</h1>
      <p>Повернімося до знайомої стежинки.</p>
      <Link className="button" href="/">
        На головну <LinkIcon />
      </Link>
    </section>
  );
}
