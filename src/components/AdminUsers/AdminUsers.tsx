"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod/v4";
import { readUsers, savePermissions } from "@/app/actions/admin";
import { permissionsSchema } from "@/lib/validation";
import { ROLES, FRIENDLY_ERROR } from "@/lib/constants";
import type { Actor } from "@/lib/permissions";
import { useToast } from "../Providers/Providers";
import { Loader } from "../Loader/Loader";
import { Modal } from "../Modal/Modal";
import styles from "./AdminUsers.module.scss";
function UserRow({ user }: { user: Actor }) {
  const toast = useToast();
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const form = useForm<z.infer<typeof permissionsSchema>>({
    resolver: zodResolver(permissionsSchema),
    defaultValues: {
      userId: user.id,
      roles: user.roles,
      confirmLastAdmin: false,
    },
  });
  const submit = form.handleSubmit(async (data) => {
    try {
      const result = await savePermissions(data);
      if (!result.ok) {
        if (result.code === "LAST_ADMIN") {
          setConfirm(true);
          return;
        }
        throw new Error("SAVE_FAILED");
      }
      setConfirm(false);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["users"] }),
        client.invalidateQueries({ queryKey: ["viewer"] }),
      ]);
      toast("Права доступу збережено.");
    } catch {
      toast(FRIENDLY_ERROR, true);
    }
  });
  return (
    <form className={styles.user} onSubmit={submit}>
      <div className={styles.identity}>
        <b>
          {user.name} {user.surname}
        </b>
        <span>{user.email}</span>
      </div>
      <fieldset disabled={form.formState.isSubmitting}>
        {ROLES.map((role) => (
          <label key={role}>
            <input type="checkbox" value={role} {...form.register("roles")} />
            {role === "admin" ? "Адмін" : `${role.slice(-1)} клас`}
          </label>
        ))}
        <button type="submit">Зберегти</button>
      </fieldset>
      {form.formState.isSubmitting && <Loader />}
      {confirm && (
        <Modal
          title="Зняти права останнього адміністратора?"
          onClose={() => setConfirm(false)}
        >
          <p>
            Після цієї зміни ніхто не зможе керувати доступом через сайт. Для
            відновлення знадобиться доступ власника до бази даних.
          </p>
          <div className="actions">
            <button
              className="danger"
              disabled={form.formState.isSubmitting}
              onClick={() => {
                form.setValue("confirmLastAdmin", true);
                void submit();
              }}
            >
              Підтверджую зняття прав
            </button>
            <button className="secondary" onClick={() => setConfirm(false)}>
              Скасувати
            </button>
          </div>
        </Modal>
      )}
    </form>
  );
}
export function AdminUsers() {
  const query = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const result = await readUsers();
      if (!result.ok) throw new Error("USERS_FAILED");
      return result.data;
    },
  });
  return (
    <section className="container section">
      <p className="muted">
        Вхід через Google не надає права редагування. Позначка класу дозволяє
        змінювати тільки його розклад і галерею. Адміністратор має доступ до
        всіх класів і шкільної галереї.
      </p>
      {query.isPending ? (
        <Loader />
      ) : query.isError ? (
        <div className="empty">
          <p>Не вдалося завантажити користувачів.</p>
          <button onClick={() => void query.refetch()}>
            Спробувати ще раз
          </button>
        </div>
      ) : query.data.length ? (
        query.data.map((user) => (
          <UserRow key={`${user.id}-${user.roles.join()}`} user={user} />
        ))
      ) : (
        <p className="empty">Тут з’являться користувачі після першого входу.</p>
      )}
    </section>
  );
}
