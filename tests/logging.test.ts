import { beforeEach, expect, it, vi } from "vitest";

const records = vi.hoisted(() => [] as Record<string, unknown>[]);
vi.mock("@/db", () => ({
  getDb: () => ({
    insert: () => ({
      values: async (record: Record<string, unknown>) => {
        records.push(record);
      },
    }),
  }),
}));
vi.mock("@/lib/env", () => ({ env: { DATABASE_URL: "configured" } }));

import { logError } from "@/lib/logging";

beforeEach(() => {
  records.length = 0;
});

it("records a provider HTTP status and user without leaking the provider response", async () => {
  await logError(
    "photo.create.upload",
    { error: { http_code: 401, message: "secret provider detail" } },
    {
      id: "10000000-0000-4000-8000-000000000001",
      email: "teacher@example.test",
      name: null,
      surname: null,
      roles: ["class_1"],
    },
  );

  expect(records).toEqual([
    {
      location: "photo.create.upload",
      errorCode: "HTTP_401",
      message: "Operation failed",
      userId: "10000000-0000-4000-8000-000000000001",
      userEmail: "teacher@example.test",
    },
  ]);
  expect(JSON.stringify(records)).not.toContain("secret provider detail");
});
