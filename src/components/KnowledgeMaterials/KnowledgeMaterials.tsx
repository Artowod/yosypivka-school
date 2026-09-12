"use client";

import Image from "next/image";
import { useState } from "react";
import { Modal } from "@/components/Modal/Modal";
import { Loader } from "@/components/Loader/Loader";
import { useToast } from "@/components/Providers/Providers";
import { DocumentIcon } from "@/components/DocumentIcon/DocumentIcon";
import type { KnowledgeMaterial, ContentBlock } from "@/lib/knowledge";
import styles from "./KnowledgeMaterials.module.scss";

function DocumentPage({ src, width, height, alt }: { src: string; width: number; height: number; alt: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const toast = useToast();
  return (
    <div className={styles.documentPage}>
      {state === "loading" && <div className={styles.loading}><Loader label="Відкриваємо сторінку…" /></div>}
      {state === "error" ? <p role="status">Упс! Не вдалося відкрити сторінку. Спробуйте завантажити документ.</p> : (
        <Image src={src} alt={alt} width={width} height={height} sizes="(min-width: 1200px) 1200px, 88vw"
          onLoad={() => setState("ready")} onError={() => { setState("error"); toast("Не вдалося відкрити сторінку документа. Спробуйте завантажити оригінал.", true); }} />
      )}
    </div>
  );
}

function DocumentText({ blocks }: { blocks: ContentBlock[] }) {
  return <div className={styles.documentText}>{blocks.map((block, index) => block.type === "table" ? (
    <div key={index} className={styles.tableWrap}><table><tbody>{block.rows.map((row, rowIndex) => (
      <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
    ))}</tbody></table></div>
  ) : block.type === "h2" ? <h2 key={index}>{block.text}</h2> : <p key={index}>{block.text}</p>)}</div>;
}

export function KnowledgeMaterials({ materials }: { materials: KnowledgeMaterial[] }) {
  const [selected, setSelected] = useState<KnowledgeMaterial | null>(null);
  return (
    <>
      <div className={styles.grid}>
        {materials.map((material) => (
          <button className={styles.card} type="button" key={material.file} onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); setSelected(material); }} aria-label={`Відкрити ${material.title}`}>
            <span className={styles.preview}>
              {material.kind === "image" ? <Image src={material.file} alt="" fill sizes="(min-width: 768px) 300px, 85vw" /> : <DocumentIcon />}
            </span>
            <strong>{material.title}</strong>
            <span className={styles.caption}>{material.format.toUpperCase()} · Переглянути</span>
          </button>
        ))}
      </div>
      {selected && (
        <Modal title={selected.title} wide onClose={() => setSelected(null)}>
          <a className="button secondary" href={selected.file} download>Завантажити {selected.format.toUpperCase()}</a>
          <div className={styles.viewer}>
            {selected.kind === "image" ? <DocumentPage src={selected.file} width={selected.width ?? 1280} height={selected.height ?? 1280} alt={selected.title} /> : (
              <>
                {selected.pages?.map((page, index) => <DocumentPage key={page.src} {...page} alt={`${selected.title}, сторінка ${index + 1}`} />)}
                {selected.blocks && <DocumentText blocks={selected.blocks} />}
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
