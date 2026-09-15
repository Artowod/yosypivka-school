"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { photoMetadataSchema } from "@/lib/validation";
import { preparePhoto } from "@/lib/compressImage";
import { createPhoto, editPhoto } from "@/app/actions/photos";
import type { Photo } from "@/lib/demo";
import { FRIENDLY_ERROR, type GalleryId } from "@/lib/constants";
import { localDate } from "@/lib/dates";
import { Modal } from "../Modal/Modal";
import { Loader } from "../Loader/Loader";
import { useToast } from "../Providers/Providers";
export function PhotoEditor({
  photo,
  galleryId,
  onClose,
  onSaved,
}: {
  photo?: Photo;
  galleryId: GalleryId;
  onClose: () => void;
  onSaved: (change: {
    type: "created" | "updated";
    photo: Photo;
  }) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const toast = useToast();
  const form = useForm<z.infer<typeof photoMetadataSchema>>({
    resolver: zodResolver(photoMetadataSchema),
    defaultValues: {
      title: photo?.title ?? "",
      description: photo?.description ?? "",
      creationDate: photo?.creationDate ?? localDate(),
    },
  });
  const submit = form.handleSubmit(async (data) => {
    try {
      let result;
      if (photo) result = await editPhoto({ ...data, id: photo.id });
      else {
        if (!file) {
          toast("Оберіть фотографію.", true);
          return;
        }
        let prepared: File;
        try {
          prepared = await preparePhoto(file);
        } catch {
          toast(
            "Не вдалося підготувати фото. Оберіть JPEG, PNG, WebP або HEIC/HEIF до 5 МБ.",
            true,
          );
          return;
        }
        const payload = new FormData();
        payload.set("file", prepared);
        payload.set("galleryId", galleryId);
        Object.entries(data).forEach(([key, value]) => payload.set(key, value));
        result = await createPhoto(payload);
      }
      if (!result.ok) throw new Error("SAVE_FAILED");
      await onSaved({
        type: photo ? "updated" : "created",
        photo: result.data,
      });
      toast(photo ? "Підпис до фотографії оновлено!" : "Нову світлину додано!");
      onClose();
    } catch {
      toast(FRIENDLY_ERROR, true);
    }
  });
  return (
    <Modal
      title={photo ? "Редагувати підпис" : "Додати світлину"}
      onClose={onClose}
      explicitCloseOnly
    >
      <form className="form" onSubmit={submit}>
        <fieldset className="form" disabled={form.formState.isSubmitting}>
          {!photo && (
            <label>
              Фотографія
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                required
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <small className="muted">
                Фото понад 5 МБ спробуємо зменшити. Для HEIC/HEIF оберіть файл
                до 5 МБ.
              </small>
            </label>
          )}
          <label>
            Назва
            <input
              {...form.register("title")}
              aria-invalid={!!form.formState.errors.title}
            />
            {form.formState.errors.title && (
              <span className="formError">
                {form.formState.errors.title.message}
              </span>
            )}
          </label>
          <label>
            Опис
            <textarea {...form.register("description")} />
            {form.formState.errors.description && (
              <span className="formError">Опис має бути до 3000 символів.</span>
            )}
          </label>
          <label>
            Дата фотографії
            <input type="date" {...form.register("creationDate")} />
            {form.formState.errors.creationDate && (
              <span className="formError">Вкажіть коректну дату.</span>
            )}
          </label>
          <div className="actions">
            <button type="submit">Зберегти</button>
            <button className="secondary" type="button" onClick={onClose}>
              Скасувати
            </button>
          </div>
        </fieldset>
        {form.formState.isSubmitting && (
          <Loader label="Готуємо та зберігаємо світлину…" />
        )}
      </form>
    </Modal>
  );
}
