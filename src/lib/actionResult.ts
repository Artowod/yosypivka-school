import { FRIENDLY_ERROR } from "./constants";
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; message: string; code?: "LAST_ADMIN" };
export const failure = (): ActionResult<never> => ({
  ok: false,
  message: FRIENDLY_ERROR,
});
