import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { KNOWLEDGE_GROUPS, publicKnowledgePages, type KnowledgeContent } from "../src/lib/knowledge";
import { KNOWLEDGE_CONTENT } from "../src/content/knowledge";

describe("published school materials", () => {
  it("retains all old subsections while excluding hidden and relocated pages from routes", () => {
    expect(KNOWLEDGE_GROUPS.map((group) => group.pages.length)).toEqual([10, 8, 5, 0]);
    expect(KNOWLEDGE_GROUPS.find((group) => group.id === "students")?.hidden).toBe(true);
    const slugs = publicKnowledgePages().map(({ page }) => page.slug);
    for (const excluded of ["license", "textbooks", "new-school", "bells", "history", "staff", "programs", "inclusive-education"]) expect(slugs).not.toContain(excluded);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("publishes only populated pages and genuine local documents with usable previews", () => {
    for (const { page } of publicKnowledgePages()) {
      const content: KnowledgeContent = KNOWLEDGE_CONTENT[page.slug as keyof typeof KNOWLEDGE_CONTENT];
      expect(content.blocks.length + content.materials.length, page.slug).toBeGreaterThan(0);
      for (const material of content.materials) {
        expect(material.file).toMatch(/^\/knowledge\/[\w-]+\.(pdf|docx|jpg|png)$/);
        const original = readFileSync(join(process.cwd(), "public", material.file));
        if (material.format === "pdf") {
          expect(original.subarray(0, 4).toString()).toBe("%PDF");
          expect(material.pages?.length).toBeGreaterThan(0);
          for (const preview of material.pages ?? []) expect(existsSync(join(process.cwd(), "public", preview.src)), preview.src).toBe(true);
        }
        if (material.format === "docx") {
          expect(original.subarray(0, 2).toString()).toBe("PK");
          expect(material.blocks?.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
