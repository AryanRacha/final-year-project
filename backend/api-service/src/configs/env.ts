import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DB_URL: z.string().min(1, "DB_URL is required"),

  // GitHub OAuth App (User Auth)
  GITHUB_CLIENT_ID: z.string().default("mock_client_id"),
  GITHUB_CLIENT_SECRET: z.string().default("mock_client_secret"),
  GITHUB_OAUTH_REDIRECT_URI: z
    .string()
    .default("http://localhost:5000/api/auth/github/callback"),

  // Platform GitHub App (Repo Access & Webhooks)
  GITHUB_APP_ID: z.string().default("123456"),
  GITHUB_APP_SLUG: z.string().default("my-repo-manager-app"),
  GITHUB_APP_PRIVATE_KEY: z
    .string()
    .default(
      "-----BEGIN RSA PRIVATE KEY-----\nMOCK_KEY\n-----END RSA PRIVATE KEY-----",
    ),
  GITHUB_WEBHOOK_SECRET: z.string().default("mock_webhook_secret"),

  // JWT & Session Security
  JWT_SECRET: z
    .string()
    .default("super_secret_jwt_key_change_in_production_32bytes"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  console.log("DB_URL exists:", !!process.env.DB_URL);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("FRONTEND_URL exists:", !!process.env.FRONTEND_URL);

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("ENV VALIDATION FAILED");
    console.error(result.error.flatten().fieldErrors);

    throw new Error("Environment validation failed");
  }

  return result.data;
}

export const env = loadEnv();
