import type { Instrumentation } from "next";
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  _request,
  context,
) => {
  const { logError } = await import("@/lib/logging");
  await logError(`render:${context.routeType}`, error);
};
