import { App } from "octokit";
import { eq } from "drizzle-orm";
import { env } from "../../configs/env";
import { db } from "../../db";
import {
  githubInstallations,
  connectedRepositories,
  type ConnectedRepository,
} from "../../db/schema";

let octokitApp: App | null = null;

/**
 * Lazily initializes the Octokit App instance.
 */
function getOctokitApp(): App {
  if (!octokitApp) {
    octokitApp = new App({
      appId: env.GITHUB_APP_ID,
      privateKey: env.GITHUB_APP_PRIVATE_KEY,
      webhooks: {
        secret: env.GITHUB_WEBHOOK_SECRET,
      },
    });
  }
  return octokitApp;
}

/**
 * Generates the URL for a user to install the Platform GitHub App.
 */
export function getAppInstallationUrl(state?: string): string {
  const params = new URLSearchParams();
  if (state) params.append("state", state);

  const queryString = params.toString();
  return `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new${queryString ? `?${queryString}` : ""}`;
}

/**
 * Fetches repositories from a GitHub App installation and syncs them to the database.
 * - Upserts the installation record.
 * - Upserts each accessible repository.
 */
export async function syncInstallationRepositories(
  installationId: string,
  userId: string,
): Promise<ConnectedRepository[]> {
  const app = getOctokitApp();
  const octokit = await app.getInstallationOctokit(Number(installationId));

  // Fetch installation metadata
  const { data: installationData } = await octokit.request(
    "GET /installation",
  );

  const account = installationData.account as
    | { login: string; id: number }
    | null;

  // Upsert installation record
  const [savedInst] = await db
    .insert(githubInstallations)
    .values({
      userId,
      installationId: String(installationData.id),
      accountLogin: account?.login ?? "unknown",
      accountId: account ? String(account.id) : "0",
      targetType: installationData.target_type ?? "User",
    })
    .onConflictDoUpdate({
      target: githubInstallations.installationId,
      set: {
        accountLogin: account?.login ?? "unknown",
        accountId: account ? String(account.id) : "0",
        targetType: installationData.target_type ?? "User",
      },
    })
    .returning();

  // Fetch accessible repositories
  const { data: reposData } = await octokit.request(
    "GET /installation/repositories",
  );

  const syncedRepos: ConnectedRepository[] = [];

  for (const repo of reposData.repositories) {
    const [savedRepo] = await db
      .insert(connectedRepositories)
      .values({
        installationId: savedInst!.id,
        userId,
        githubRepoId: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
        isPrivate: repo.private,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch ?? "main",
        isActive: true,
      })
      .onConflictDoUpdate({
        target: connectedRepositories.githubRepoId,
        set: {
          name: repo.name,
          fullName: repo.full_name,
          isPrivate: repo.private,
          htmlUrl: repo.html_url,
          defaultBranch: repo.default_branch ?? "main",
          isActive: true,
        },
      })
      .returning();

    syncedRepos.push(savedRepo!);
  }

  return syncedRepos;
}
