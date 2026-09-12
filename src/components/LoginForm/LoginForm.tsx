"use client";
import { LinkIcon } from "@/components/LinkIcon/LinkIcon";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useToast } from "../Providers/Providers";
import { Loader } from "../Loader/Loader";
import { FRIENDLY_ERROR } from "@/lib/constants";
export function LoginForm({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const search = useSearchParams();
  const toast = useToast();
  const hasError = search.has("error");
  useEffect(() => {
    if (hasError) toast(FRIENDLY_ERROR, true);
  }, [hasError, toast]);
  return (
    <div className="container section empty">
      <h2>Раді бачити вас знову</h2>
      <p>
        Увійдіть через свій Google-акаунт.
        <br />
        Доступ до класів надає адміністратор школи.
      </p>
      {configured ? (
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await signIn("google", { callbackUrl: "/" });
            } catch {
              toast(FRIENDLY_ERROR, true);
              setBusy(false);
            }
          }}
        >
          Увійти через Google <LinkIcon />
        </button>
      ) : (
        <p>
          Вхід для працівників ще готується. Публічні сторінки доступні для
          перегляду.
        </p>
      )}
      {busy && <Loader label="Відкриваємо вхід через Google…" />}
    </div>
  );
}
