"use client";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./FilterSelect.module.scss";
type Option = { value: string; label: string };
export function FilterSelect({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const expanded = open && !disabled;
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [expanded]);
  useEffect(() => {
    if (expanded)
      document
        .getElementById(`${id}-option-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, expanded, id]);
  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  return (
    <div
      className={styles.field}
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <span id={`${id}-label`}>{label}</span>
      <div className={styles.control}>
        <button
          ref={trigger}
          type="button"
          role="combobox"
          aria-labelledby={`${id}-label`}
          aria-expanded={expanded}
          aria-controls={`${id}-list`}
          aria-haspopup="listbox"
          aria-activedescendant={
            expanded ? `${id}-option-${active}` : undefined
          }
          disabled={disabled}
          className={styles.trigger}
          onClick={() => {
            trigger.current?.focus({ preventScroll: true });
            setActive(selected);
            setOpen(!expanded);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              event.preventDefault();
              return;
            }
            if (event.key === "Tab") {
              setOpen(false);
              return;
            }
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              setActive(
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? options.length - 1
                    : !expanded
                      ? selected
                      : (active +
                          (event.key === "ArrowDown" ? 1 : -1) +
                          options.length) %
                        options.length,
              );
              setOpen(true);
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (expanded) choose(active);
              else {
                setActive(selected);
                setOpen(true);
              }
            } else if (event.key.length === 1) {
              const match = options.findIndex((option) =>
                option.label
                  .toLocaleLowerCase("uk")
                  .startsWith(event.key.toLocaleLowerCase("uk")),
              );
              if (match >= 0) {
                event.preventDefault();
                setActive(match);
                setOpen(true);
              }
            }
          }}
        >
          <span>{options[selected].label}</span>
          <svg
            className={styles.chevron}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {expanded && (
          <div
            id={`${id}-list`}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className={styles.list}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={`${styles.option} ${index === active ? styles.active : ""}`}
                onPointerMove={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
