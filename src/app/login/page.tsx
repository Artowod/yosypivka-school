import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm/LoginForm";
import { PageHero } from "@/components/PageHero/PageHero";
import { Loader } from "@/components/Loader/Loader";
import { authConfigured } from "@/lib/env";
export const metadata = {
  title: "Вхід до школи",
  robots: { index: false, follow: false },
};
export default function LoginPage() {
  return (
    <>
      <PageHero
        title="Вхід до школи"
        description="Для вчителів, адміністрації та нашої шкільної спільноти."
        eyebrow="Завжди раді своїм"
        kind="school"
      />
      <Suspense fallback={<Loader />}>
        <LoginForm configured={authConfigured} />
      </Suspense>
    </>
  );
}
