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
export function getOctokitApp(): App | null {
  if (!octokitApp) {
    const rawKey = (env.GITHUB_APP_PRIVATE_KEY || "").trim();
    if (!rawKey || rawKey.includes("MOCK_KEY")) {
      return null;
    }
    let privateKey = rawKey.replace(/\\n/g, "\n").trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1).replace(/\\n/g, "\n").trim();
    }
    try {
      octokitApp = new App({
        appId: env.GITHUB_APP_ID,
        privateKey,
        webhooks: {
          secret: env.GITHUB_WEBHOOK_SECRET,
        },
      });
    } catch (e: any) {
      console.warn("⚠️ Octokit App initialization skipped:", e.message || e);
      return null;
    }
  }
  return octokitApp;
}

/**
 * Dynamically resolves an Octokit client for a given owner/repo.
 * First checks DB records, then falls back to GitHub App API lookup.
 */
export async function getInstallationOctokitForRepo(owner: string, repo: string) {
  const app = getOctokitApp();
  if (!app) return null;

  const fullName = `${owner}/${repo}`;

  // 1. Try DB lookup
  try {
    const [repoRecord] = await db
      .select()
      .from(connectedRepositories)
      .where(eq(connectedRepositories.fullName, fullName))
      .limit(1);

    if (repoRecord) {
      const [instRecord] = await db
        .select()
        .from(githubInstallations)
        .where(eq(githubInstallations.id, repoRecord.installationId))
        .limit(1);

      if (instRecord && instRecord.installationId) {
        return await app.getInstallationOctokit(Number(instRecord.installationId));
      }
    }
  } catch (e) {
    console.warn("DB lookup notice in getInstallationOctokitForRepo:", e);
  }

  // 2. Query GitHub App API directly
  try {
    const { data: instData } = await app.octokit.request("GET /repos/{owner}/{repo}/installation", {
      owner,
      repo,
    });
    if (instData && instData.id) {
      return await app.getInstallationOctokit(instData.id);
    }
  } catch (err: any) {
    console.warn(`Could not resolve Octokit installation for ${fullName}:`, err.message || err);
  }

  return null;
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
