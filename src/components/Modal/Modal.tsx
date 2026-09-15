"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./Modal.module.scss";
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  lightbox = false,
  headerAction,
  explicitCloseOnly = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  lightbox?: boolean;
  headerAction?: ReactNode;
  explicitCloseOnly?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => setClosing(true), []);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, []);
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(onClose, 180);
    return () => clearTimeout(timer);
  }, [closing, onClose]);
  return (
    <dialog
      ref={ref}
      className={`${styles.modal} ${wide ? styles.wide : ""} ${
        lightbox ? styles.lightbox : ""
      } ${closing ? styles.closing : ""}`}
      aria-label={title}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!explicitCloseOnly) close();
          return;
        }
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (!first) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!explicitCloseOnly) close();
      }}
      onClick={(event) => {
        if (!explicitCloseOnly && event.target === ref.current) close();
      }}
    >
      <div className={styles.content}>
        <header>
          <h2>{title}</h2>
          <div className={styles.headerActions}>
            {headerAction ? headerAction : <div></div>}
            <button
              className="secondary"
              type="button"
              onClick={close}
              aria-label="Закрити вікно"
            >
              ×
            </button>
          </div>
        </header>
        {children}
      </div>
    </dialog>
  );
}
