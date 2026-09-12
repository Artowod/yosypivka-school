import "server-only";
import { z } from "zod/v4";
const optional = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
export const env = z
  .object({
    DATABASE_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url().startsWith("postgres").optional(),
    ),
    WEATHERAPI_KEY: optional,
    AUTH_SECRET: optional,
    AUTH_GOOGLE_ID: optional,
    AUTH_GOOGLE_SECRET: optional,
    CLOUDINARY_CLOUD_NAME: optional,
    CLOUDINARY_API_KEY: optional,
    CLOUDINARY_API_SECRET: optional,
    SITE_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.url().optional(),
    ),
  })
  .parse(process.env);
export const authConfigured = !!(
  env.DATABASE_URL &&
  env.AUTH_SECRET &&
  env.AUTH_GOOGLE_ID &&
  env.AUTH_GOOGLE_SECRET
);
