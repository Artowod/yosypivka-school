"use client";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readSchedule, saveSchedule } from "@/app/actions/schedule";
import { canEditClass } from "@/lib/permissions";
import { currentDay } from "@/lib/dates";
import { DAYS, DAY_NAMES, FRIENDLY_ERROR } from "@/lib/constants";
import { scheduleSchema, type ScheduleInput } from "@/lib/validation";
import { useViewer, useToast } from "../Providers/Providers";
import { Illustration } from "../Illustration/Illustration";
import { Loader } from "../Loader/Loader";
import styles from "./ClassSchedule.module.scss";
interface ScheduleData {
  entries: ScheduleInput["entries"];
  slots: string[];
  demo: boolean;
}
export function ClassSchedule({
  classId,
  initialData,
}: {
  classId: number;
  initialData: ScheduleData;
}) {
  const [today, setToday] = useState(-1);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const viewer = useViewer();
  const toast = useToast();
  const queryClient = useQueryClient();
  const form = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      classId,
      entries: initialData.entries,
    },
  });
  useEffect(() => {
    const tick = () => {
      setToday(currentDay());
    };
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey: ["schedule", classId],
    queryFn: async () => {
      const result = await readSchedule(classId);
      if (!result.ok) throw new Error("SCHEDULE_FAILED");
      return result.data;
    },
    initialData,
    refetchInterval: 60000,
  });
  const data = query.data;
  const allowed = canEditClass(viewer.data?.actor ?? null, classId);
  async function beginEdit() {
    setLoading(true);
    try {
      const result = await readSchedule(classId);
      if (!result.ok) throw new Error("SCHEDULE_FAILED");
      form.reset({
        classId,
        entries: result.data.entries,
      });
      setEditing(true);
    } catch {
      toast(FRIENDLY_ERROR, true);
    } finally {
      setLoading(false);
    }
  }
  const submit = form.handleSubmit(
    async (values) => {
      try {
        const result = await saveSchedule(values);
        if (!result.ok) throw new Error("SAVE_FAILED");
        await queryClient.invalidateQueries({
          queryKey: ["schedule", classId],
        });
        setEditing(false);
        toast("Розклад збережено. Гарного навчального тижня!");
      } catch {
        toast(FRIENDLY_ERROR, true);
      }
    },
    () =>
      toast("Перевірте розклад: кожен урок має бути до 120 символів.", true),
  );
  const editedEntries = useWatch({ control: form.control, name: "entries" });
  const entries = editing ? editedEntries : data?.entries ?? [];
  return (
    <section id="schedule" className={`container section ${styles.section}`}>
      <div className={styles.heading}>
        <Illustration kind="pencil" />
        <div>
          <p className="eyebrow">Наш шкільний щоденник</p>
          <h2>Розклад занять</h2>
          <p>{editing ? "Редагуємо розклад" : "Постійний розклад класу"}</p>
        </div>
        {allowed && !editing && (
          <button onClick={() => void beginEdit()} disabled={loading}>
            Змінити
          </button>
        )}
      </div>
      {data?.demo && (
        <p className={styles.note}>Приклад розкладу. Предмети та час уроків.</p>
      )}
      {query.isError && (
        <p role="status" className="empty">
          Не вдалося оновити розклад.{" "}
          <button onClick={() => void query.refetch()}>
            Спробувати ще раз
          </button>
        </p>
      )}
      {!data && <Loader />}
      {data && !data.entries.some((entry) => entry.subject) && !editing && (
        <p className={styles.note}>
          Розклад ще готується. Завітайте трохи пізніше!
        </p>
      )}
      <form onSubmit={submit}>
        <fieldset disabled={loading || form.formState.isSubmitting}>
          <div className={styles.days}>
            {DAYS.map((day, index) => (
              <article
                key={day}
                className={`${styles.day} ${
                  today === index ? styles.today : ""
                }`}
              >
                <h3>
                  {DAY_NAMES[index]}
                  {today === index && (
                    <span>
                      <Illustration kind="sunflower" /> Сьогодні
                    </span>
                  )}
                </h3>
                <table>
                  <caption className={styles.visuallyHidden}>
                    {DAY_NAMES[index]} — час і назви уроків
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Час</th>
                      <th scope="col">Урок</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }, (_, lessonIndex) => {
                      const entryIndex = entries.findIndex(
                        (entry) =>
                          entry.dayOfWeek === day &&
                          entry.lessonNumber === lessonIndex + 1,
                      );
                      return (
                        <tr key={lessonIndex}>
                          <th scope="row">{data?.slots[lessonIndex]}</th>
                          <td>
                            {editing && entryIndex >= 0 ? (
                              <input
                                aria-label={`${DAY_NAMES[index]}, урок ${
                                  lessonIndex + 1
                                }`}
                                maxLength={120}
                                {...form.register(
                                  `entries.${entryIndex}.subject`,
                                )}
                              />
                            ) : (
                              entries[entryIndex]?.subject || (
                                <span className={styles.emptyLesson}>—</span>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </article>
            ))}
          </div>
          {editing && (
            <div className={styles.editBar}>
              <button type="submit">Зберегти</button>
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(false)}
              >
                Скасувати
              </button>
            </div>
          )}
        </fieldset>
      </form>
      {(loading || form.formState.isSubmitting) && (
        <Loader label="Записуємо уроки у щоденник…" />
      )}
    </section>
  );
}
