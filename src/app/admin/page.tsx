import { redirect } from "next/navigation";
import { getActor } from "@/lib/session";
import { logError } from "@/lib/logging";
import { PageHero } from "@/components/PageHero/PageHero";
import { AdminUsers } from "@/components/AdminUsers/AdminUsers";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Адмін-кабінет",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  let actor;
  try {
    actor = await getActor();
  } catch (error) {
    await logError("admin.access", error);
    throw new Error("ACCESS_UNAVAILABLE");
  }
  if (!actor) redirect("/login");
  if (!actor.roles.includes("admin"))
    return (
      <section className="container section empty">
        <h1>Ця сторінка для адміністратора</h1>
        <p>Права доступу до неї надає адміністратор школи.</p>
      </section>
    );
  return (
    <>
      <PageHero
        title="Адмін-кабінет"
        description="Керуйте доступом до розкладу та галерей школи."
        eyebrow="Люди та дозволи"
        kind="book"
      />
      <AdminUsers />
    </>
  );
}
