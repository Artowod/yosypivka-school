"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useSearchParams } from "next/navigation";
import { readPhotos, deletePhoto } from "@/app/actions/photos";
import { canEditGallery } from "@/lib/permissions";
import { GALLERIES, FRIENDLY_ERROR, type GalleryId } from "@/lib/constants";
import type { Photo } from "@/lib/demo";
import type { PhotoBatch } from "@/lib/data";
import { updateCachedPhotos, type PhotoChange } from "@/lib/photoCache";
import { originalDownloadUrl, photoUrl } from "@/lib/images";
import { formatDate } from "@/lib/dates";
import { useViewer, useToast } from "../Providers/Providers";
import { Modal } from "../Modal/Modal";
import { Loader } from "../Loader/Loader";
import { Illustration } from "../Illustration/Illustration";
import { FilterSelect } from "../FilterSelect/FilterSelect";
import { PhotoEditor } from "../PhotoEditor/PhotoEditor";
import styles from "./PhotoGallery.module.scss";

const PHOTO_QUERY_CACHE_TIME = 60 * 60 * 1000;

export function PhotoGallery({
  galleryId,
  initialData,
  archive = false,
}: {
  galleryId?: GalleryId;
  initialData: PhotoBatch;
  archive?: boolean;
}) {
  const search = useSearchParams();
  const selectedGallery =
    galleryId ??
    (GALLERIES.includes(search.get("gallery") as GalleryId)
      ? (search.get("gallery") as GalleryId)
      : undefined);
  const year =
    /^\d{4}$/.test(search.get("year") ?? "") &&
    Number(search.get("year")) >= 1900 &&
    Number(search.get("year")) <= 2200
      ? Number(search.get("year"))
      : undefined;
  const month =
    year &&
    Number(search.get("month")) >= 1 &&
    Number(search.get("month")) <= 12
      ? Number(search.get("month"))
      : undefined;
  const ref = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Photo | null>(null);
  const [editor, setEditor] = useState<Photo | GalleryId | null>(null);
  const [deleting, setDeleting] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const toast = useToast();
  const viewer = useViewer();
  const queryClient = useQueryClient();
  const actor = viewer.data?.actor ?? null;
  const createGallery = galleryId ?? (archive ? selectedGallery : undefined);
  const columns = width
    ? Math.max(2, Math.min(8, Math.floor(width / (width < 600 ? 140 : 190))))
    : 2;
  const limit = width >= 650 ? 50 : 10;
  const photoQueryKey = [
    "photos",
    selectedGallery ?? "all",
    year,
    month,
    limit,
  ] as const;
  const query = useInfiniteQuery({
    queryKey: photoQueryKey,
    initialPageParam: undefined as PhotoBatch["nextCursor"],
    queryFn: async ({ pageParam }) => {
      const result = await readPhotos({
        galleryId: selectedGallery,
        year,
        month,
        cursor: pageParam,
        limit,
      });
      if (!result.ok) throw new Error("PHOTOS_FAILED");
      return result.data;
    },
    getNextPageParam: (last) => last.nextCursor,
    initialData:
      limit === 10 && !year && !month && selectedGallery === galleryId
        ? { pages: [initialData], pageParams: [undefined] }
        : undefined,
    staleTime: PHOTO_QUERY_CACHE_TIME,
    gcTime: PHOTO_QUERY_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => page.items) ?? []).filter(
      (photo) => {
        if (seen.has(photo.id)) return false;
        seen.add(photo.id);
        return true;
      },
    );
  }, [query.data]);
  const rows = useMemo(() => {
    const groups = new Map<string, Photo[]>();
    items.forEach((photo) => {
      const key = photo.creationDate.slice(0, 7);
      const group = groups.get(key) ?? [];
      group.push(photo);
      groups.set(key, group);
    });
    return [...groups.entries()].flatMap(([period, photos]) =>
      Array.from(
        { length: Math.ceil(photos.length / columns) },
        (_, index) => ({
          period,
          heading: index === 0,
          photos: photos.slice(index * columns, (index + 1) * columns),
        }),
      ),
    );
  }, [items, columns]);
  const rowHeight =
    (width ? (width - (columns - 1) * 14) / columns : 180) * 0.8 +
    (actor ? 138 : 84);
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    overscan: 3,
    scrollMargin: offset,
  });
  const virtualRows = virtualizer.getVirtualItems();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      setWidth(element.clientWidth);
      setOffset(element.getBoundingClientRect().top + window.scrollY);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  useEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = query;
  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isFetchNextPageError
        )
          void fetchNextPage();
      },
      { rootMargin: "650px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);
  function belongsToCurrentFilter(photo: Photo) {
    const photoYear = Number(photo.creationDate.slice(0, 4));
    const photoMonth = Number(photo.creationDate.slice(5, 7));
    return (
      (!selectedGallery || photo.galleryId === selectedGallery) &&
      (!year || photoYear === year) &&
      (!month || photoMonth === month)
    );
  }
  async function refresh(change: PhotoChange) {
    queryClient.setQueryData<InfiniteData<PhotoBatch>>(
      photoQueryKey,
      (cached) => updateCachedPhotos(cached, change, belongsToCurrentFilter),
    );
    setSelected((photo) =>
      photo?.id === change.photo.id
        ? change.type === "deleted"
          ? null
          : change.photo
        : photo,
    );
    queryClient.removeQueries({ queryKey: ["photos"], type: "inactive" });
  }
  function setFilter(name: string, value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    if (name === "year" && !value) params.delete("month");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${params.size ? `?${params}` : ""}`,
    );
  }
  function openPhoto(photo: Photo) {
    setImageFailed(false);
    setImageLoading(true);
    setSelected(photo);
  }
  function card(photo: Photo) {
    const allowed = canEditGallery(actor, photo.galleryId);
    return (
      <article key={photo.id} className={styles.card}>
        <button
          className={styles.photoButton}
          aria-label={`Відкрити ${photo.title}`}
          onClick={(event) => {
            event.currentTarget.focus();
            openPhoto(photo);
          }}
        >
          <Image
            src={photoUrl(photo)}
            alt={photo.title}
            fill
            sizes="(max-width: 649px) 45vw, 240px"
          />
          <span className={styles.openHint}>⤢</span>
        </button>
        <div className={styles.caption}>
          <strong>{photo.title}</strong>
          <time dateTime={photo.creationDate}>
            {formatDate(photo.creationDate, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
        </div>
        {allowed && (
          <div className={styles.editActions}>
            <button
              className="secondary"
              onClick={(event) => {
                event.currentTarget.focus();
                setEditor(photo);
              }}
            >
              Редагувати
            </button>
            <button
              className="secondary"
              onClick={(event) => {
                event.currentTarget.focus();
                setDeleting(photo);
              }}
            >
              Видалити
            </button>
          </div>
        )}
      </article>
    );
  }
  return (
    <section className="container section">
      {archive && (
        <div className={styles.filters}>
          <label>
            Рік
            <input
              aria-label="Рік"
              type="number"
              min="1900"
              max="2200"
              placeholder="Усі роки"
              key={search.get("year") ?? "all-years"}
              defaultValue={year ?? ""}
              onBlur={(event) => setFilter("year", event.target.value)}
            />
          </label>
          <FilterSelect
            label="Місяць"
            value={String(month ?? "")}
            disabled={!year}
            onChange={(value) => setFilter("month", value)}
            options={[
              { value: "", label: "Усі місяці" },
              ...Array.from({ length: 12 }, (_, index) => ({
                value: String(index + 1),
                label: formatDate(
                  `2026-${String(index + 1).padStart(2, "0")}-01`,
                  { month: "long" },
                ),
              })),
            ]}
          />
          <FilterSelect
            label="Галерея"
            value={selectedGallery ?? ""}
            onChange={(value) => setFilter("gallery", value)}
            options={[
              { value: "", label: "Уся школа" },
              ...GALLERIES.map((id) => ({
                value: id,
                label:
                  id === "school" ? "Шкільне життя" : `${id.slice(-1)} клас`,
              })),
            ]}
          />
          <span>Спогади, до яких приємно повертатися</span>
        </div>
      )}
      <div className={styles.toolbar}>
        {query.data?.pages[0].demo && (
          <span className="badge">Демонстраційні фотографії</span>
        )}
        {createGallery && canEditGallery(actor, createGallery) && (
          <button
            onClick={(event) => {
              event.currentTarget.focus();
              setEditor(createGallery);
            }}
          >
            ＋ Додати світлину
          </button>
        )}
        {archive && actor?.roles.includes("admin") && !selectedGallery && (
          <span>Щоб додати світлину, оберіть галерею у фільтрі.</span>
        )}
      </div>
      {query.isPending && <Loader />}
      {query.isError && !items.length && (
        <div className="empty">
          <Illustration kind="sunflower" />
          <p>Не вдалося завантажити фотографії.</p>
          <button onClick={() => void query.refetch()}>
            Спробувати ще раз
          </button>
        </div>
      )}
      {!query.isPending && !query.isError && !items.length && (
        <div className="empty">
          <Illustration kind="camera" />
          <h2>Тут з’являться наші спогади</h2>
          <p>За обраний період світлин поки немає.</p>
        </div>
      )}
      <div
        ref={ref}
        className={styles.virtualList}
        style={{ height: width ? virtualizer.getTotalSize() : undefined }}
      >
        {width ? (
          virtualRows.map((row) => {
            const data = rows[row.index];
            return (
              <div
                key={`${data.period}-${row.index}`}
                className={styles.virtualRow}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: row.size,
                  transform: `translateY(${row.start - offset}px)`,
                }}
              >
                {data.heading && (
                  <h2 className={styles.period}>
                    {formatDate(`${data.period}-01`, {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                )}
                <div
                  className={styles.grid}
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                >
                  {data.photos.map(card)}
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.grid}>{items.slice(0, 10).map(card)}</div>
        )}
      </div>
      <div ref={sentinel} className={styles.sentinel}>
        {query.isFetchingNextPage && (
          <Loader label="Збираємо наступні світлини…" />
        )}
        {query.isFetchNextPageError && (
          <div className="empty">
            <p>Не вдалося завантажити наступні світлини.</p>
            <button onClick={() => void query.fetchNextPage()}>
              Спробувати ще раз
            </button>
          </div>
        )}
        {!query.hasNextPage && items.length > 0 && (
          <p>
            Усі світлини цього періоду вже тут <span aria-hidden="true">✿</span>
          </p>
        )}
      </div>
      {selected && (
        <Modal
          title={selected.title}
          lightbox
          onClose={() => setSelected(null)}
          headerAction={
            <a
              className={styles.downloadButton}
              href={originalDownloadUrl(selected)}
              download={`photo-${selected.id}.jpg`}
              aria-label={`Завантажити оригінал фото «${selected.title}»`}
              title="Завантажити оригінал"
            >
              <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path
                  d="M11 31v7a3 3 0 0 0 3 3h20a3 3 0 0 0 3-3v-7"
                  stroke="#a0a8ef"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M14 36h20"
                  stroke="#f4bd43"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <g className={styles.downloadArrow}>
                  <path
                    d="M24 7v22"
                    stroke="#4f9bd2"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <path
                    d="m16 22 8 8 8-8"
                    stroke="#6aa76b"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </a>
          }
        >
          <div className={styles.lightboxImage}>
            <Image
              src={photoUrl(selected, true)}
              alt={selected.title}
              fill
              sizes="(max-width: 640px) 90vw, 92vw"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageFailed(true);
              }}
            />
            {imageLoading && <Loader label="Відкриваємо світлину…" />}
            {imageFailed && (
              <p className="empty">
                Не вдалося відкрити світлину. Спробуйте пізніше.
              </p>
            )}
          </div>
          <p className={styles.lightboxDate}>
            {formatDate(selected.creationDate)} ·{" "}
            {selected.galleryId === "school"
              ? "Шкільне життя"
              : `${selected.galleryId.slice(-1)} клас`}
          </p>
          {selected.description && <p>{selected.description}</p>}
        </Modal>
      )}
      {editor && (
        <PhotoEditor
          photo={typeof editor === "string" ? undefined : editor}
          galleryId={typeof editor === "string" ? editor : editor.galleryId}
          onClose={() => setEditor(null)}
          onSaved={refresh}
        />
      )}{" "}
      {deleting && (
        <Modal
          title="Видалити світлину?"
          explicitCloseOnly
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p>
            «{deleting.title}» та її підпис буде видалено з галереї та архіву.
            Скасувати цю дію не вдасться.
          </p>
          <div className="actions">
            <button
              className="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await deletePhoto({
                    id: deleting.id,
                    confirmed: true,
                  });
                  if (!result.ok) throw new Error("DELETE_FAILED");
                  await refresh({ type: "deleted", photo: deleting });
                  setDeleting(null);
                  toast("Світлину видалено.");
                } catch {
                  toast(FRIENDLY_ERROR, true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Так, видалити
            </button>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Скасувати
            </button>
          </div>
          {busy && <Loader />}
        </Modal>
      )}
    </section>
  );
}
