import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import {
  authMiddleware,
  type AuthContextVariables,
} from "../../middlewares/auth.middleware";
import {
  getAppInstallationUrl,
  syncInstallationRepositories,
} from "./github-app.service";
import {
  verifySignature,
  handleEvent,
} from "./webhook.service";
import { db } from "../../db";
import {
  githubInstallations,
  connectedRepositories,
} from "../../db/schema";
import { env } from "../../configs/env";

const githubRouter = new Hono<{ Variables: AuthContextVariables }>();

/**
 * Shared webhook handler for GitHub webhook intake.
 */
export async function processWebhook(c: any) {
  const signature = c.req.header("x-hub-signature-256") || "";
  const eventName = c.req.header("x-github-event") || "pull_request";

  const rawBody = await c.req.text();

  // Verify HMAC signature in production
  const isValid = await verifySignature(rawBody, signature);
  if (!isValid && env.NODE_ENV === "production") {
    return c.json({ error: "Invalid webhook signature" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  const result = await handleEvent(eventName, payload);
  return c.json({ received: true, ...result });
}

/**
 * GET /install-url
 * Protected. Returns the GitHub App installation URL for the current user.
 */
githubRouter.get("/install-url", authMiddleware, (c) => {
  const user = c.get("user");
  const installUrl = getAppInstallationUrl(user.id);
  return c.json({ installUrl });
});

/**
 * GET /callback
 * Protected. GitHub App installation callback — syncs repos.
 */
githubRouter.get("/callback", authMiddleware, async (c) => {
  const user = c.get("user");
  const installationId = c.req.query("installation_id");
  const setupAction = c.req.query("setup_action");

  if (!installationId) {
    return c.json({ error: "Missing installation_id" }, 400);
  }

  try {
    const repos = await syncInstallationRepositories(
      installationId,
      user.id,
    );

    return c.json({
      success: true,
      setupAction,
      installationId,
      connectedRepositories: repos,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to sync installation";
    console.error(
      "❌ Error processing GitHub App installation callback:",
      err,
    );
    return c.json({ error: message }, 500);
  }
});

/**
 * GET /installations
 * Protected. Lists the current user's GitHub App installations.
 */
githubRouter.get("/installations", authMiddleware, async (c) => {
  const user = c.get("user");

  const installations = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.userId, user.id));

  return c.json({ installations });
});

/**
 * GET /repositories
 * Protected. Lists active connected repositories for the current user.
 */
githubRouter.get("/repositories", authMiddleware, async (c) => {
  const user = c.get("user");

  const repositories = await db
    .select()
    .from(connectedRepositories)
    .where(
      and(
        eq(connectedRepositories.userId, user.id),
        eq(connectedRepositories.isActive, true),
      ),
    );

  return c.json({ repositories });
});

/**
 * DELETE /repositories/:id
 * Protected. Soft-disconnects a repository (sets isActive = false).
 */
githubRouter.delete("/repositories/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const repoId = c.req.param("id");

  if (!repoId) {
    return c.json({ error: "Missing repository id" }, 400);
  }

  const [repo] = await db
    .select()
    .from(connectedRepositories)
    .where(
      and(
        eq(connectedRepositories.id, repoId),
        eq(connectedRepositories.userId, user.id),
      ),
    )
    .limit(1);

  if (!repo) {
    return c.json(
      { error: "Repository not found or access denied" },
      404,
    );
  }

  await db
    .update(connectedRepositories)
    .set({ isActive: false })
    .where(eq(connectedRepositories.id, repoId));

  return c.json({
    success: true,
    message: "Repository disconnected successfully",
  });
});

/**
 * Webhook route aliases
 */
githubRouter.post("/webhooks", processWebhook);
githubRouter.post("/", processWebhook);

export default githubRouter;
