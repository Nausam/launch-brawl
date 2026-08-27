import { z } from "zod";

const optionalUrl = z.string().trim().url().optional().or(z.literal(""));

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  NEXT_PUBLIC_APP_URL: optionalUrl,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().trim().optional().or(z.literal("")),
  CLERK_SECRET_KEY: z.string().trim().optional().or(z.literal("")),
  CLERK_WEBHOOK_SECRET: z.string().trim().optional().or(z.literal("")),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().trim().optional().or(z.literal("")),
  FIREBASE_PROJECT_ID: z.string().trim().optional().or(z.literal("")),
  FIRESTORE_DATABASE_ID: z.string().trim().optional().or(z.literal("")),
  FIREBASE_CLIENT_EMAIL: z.string().trim().optional().or(z.literal("")),
  FIREBASE_PRIVATE_KEY: z.string().trim().optional().or(z.literal("")),
  FREEMIUS_PRODUCT_ID: z.string().trim().optional().or(z.literal("")),
  FREEMIUS_API_KEY: z.string().trim().optional().or(z.literal("")),
  FREEMIUS_SECRET_KEY: z.string().trim().optional().or(z.literal("")),
  FREEMIUS_PUBLIC_KEY: z.string().trim().optional().or(z.literal("")),
  FREEMIUS_PLAN_ID_SPONSORED_REACH: z.string().trim().optional().or(z.literal("")),
  FREEMIUS_SANDBOX: z.enum(["true", "false"]).optional().or(z.literal("")),
  RESEND_API_KEY: z.string().trim().optional().or(z.literal("")),
  RESEND_FROM_EMAIL: z.string().trim().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().optional().or(z.literal("")),
  CRON_SECRET: z.string().trim().optional().or(z.literal("")),
  ADMIN_USER_IDS: z.string().trim().optional().or(z.literal("")),
  NEXT_PUBLIC_DEMO_MODE: z.enum(["true", "false"]).optional().or(z.literal("")),
  SENTRY_DSN: optionalUrl,
  STORAGE_ENDPOINT: optionalUrl,
  STORAGE_BUCKET: z.string().trim().optional().or(z.literal("")),
  STORAGE_ACCESS_KEY_ID: z.string().trim().optional().or(z.literal("")),
  STORAGE_SECRET_ACCESS_KEY: z.string().trim().optional().or(z.literal("")),
  STORAGE_PUBLIC_URL: optionalUrl,
});

export function inspectEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const parsed = environmentSchema.safeParse(env);
  const values = parsed.success ? parsed.data : {};
  const firestore = Boolean(values.FIREBASE_PROJECT_ID && values.FIRESTORE_DATABASE_ID && values.FIRESTORE_DATABASE_ID !== "(default)" && values.FIRESTORE_DATABASE_ID !== "default" && values.FIREBASE_CLIENT_EMAIL && values.FIREBASE_PRIVATE_KEY);
  const clerk = Boolean(values.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && values.CLERK_SECRET_KEY);
  const clerkWebhook = Boolean(values.CLERK_WEBHOOK_SIGNING_SECRET || values.CLERK_WEBHOOK_SECRET);
  const freemius = Boolean(values.FREEMIUS_PRODUCT_ID && values.FREEMIUS_API_KEY && values.FREEMIUS_SECRET_KEY && values.FREEMIUS_PUBLIC_KEY && values.FREEMIUS_PLAN_ID_SPONSORED_REACH);
  const resend = Boolean(values.RESEND_API_KEY && values.RESEND_FROM_EMAIL);
  const redis = Boolean(values.UPSTASH_REDIS_REST_URL && values.UPSTASH_REDIS_REST_TOKEN);
  const storage = Boolean(values.STORAGE_ENDPOINT && values.STORAGE_BUCKET && values.STORAGE_ACCESS_KEY_ID && values.STORAGE_SECRET_ACCESS_KEY && values.STORAGE_PUBLIC_URL);
  const appUrl = values.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  const validProductionAppUrl = /^https:\/\/[^/]+(?:\/)?$/i.test(appUrl);
  const errors = parsed.success ? [] : parsed.error.issues.map((issue) => issue.path.join(".") || "environment");
  const productionMissing = values.NODE_ENV === "production"
    ? [
      !firestore && "FIREBASE_PROJECT_ID/FIRESTORE_DATABASE_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY",
      !clerk && "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/CLERK_SECRET_KEY",
      !clerkWebhook && "CLERK_WEBHOOK_SIGNING_SECRET",
      !freemius && "FREEMIUS_PRODUCT_ID/FREEMIUS_API_KEY/FREEMIUS_SECRET_KEY/FREEMIUS_PUBLIC_KEY/FREEMIUS_PLAN_ID_SPONSORED_REACH",
      values.FREEMIUS_SANDBOX !== "false" && "FREEMIUS_SANDBOX must be false",
      !resend && "RESEND_API_KEY/RESEND_FROM_EMAIL",
      !redis && "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN",
      !values.CRON_SECRET && "CRON_SECRET",
      !values.ADMIN_USER_IDS && "ADMIN_USER_IDS",
      !validProductionAppUrl && "NEXT_PUBLIC_APP_URL must be an HTTPS origin without a path",
      !storage && "STORAGE_ENDPOINT/STORAGE_BUCKET/STORAGE_ACCESS_KEY_ID/STORAGE_SECRET_ACCESS_KEY/STORAGE_PUBLIC_URL",
      values.NEXT_PUBLIC_DEMO_MODE === "true" && "NEXT_PUBLIC_DEMO_MODE must be false",
    ].filter((value): value is string => Boolean(value))
    : [];
  return { valid: errors.length === 0 && productionMissing.length === 0, errors, productionMissing, integrations: { firestore, clerk, clerkWebhook, freemius, resend, redis, storage } };
}

export function assertProductionEnvironment() {
  const report = inspectEnvironment();
  if (process.env.NODE_ENV === "production" && !report.valid) {
    throw new Error(`Production environment is incomplete: ${[...report.errors, ...report.productionMissing].join(", ")}`);
  }
  return report;
}
