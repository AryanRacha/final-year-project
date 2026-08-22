import { eq } from "drizzle-orm";
import { env } from "../../configs/env";
import { db } from "../../db";
import {
  githubInstallations,
  connectedRepositories,
  type ConnectedRepository,
} from "../../db/schema";
import { SignJWT, importPKCS8 } from "jose";

import fs from "fs";
import path from "path";

/**
 * Retrieves private key from raw PEM string or file path.
 */
function getPrivateKey(): string {
  const raw = env.GITHUB_APP_PRIVATE_KEY;
  if (!raw) return "";

  if (raw.includes("-----BEGIN")) {
    return raw.replace(/\\n/g, "\n");
  }

  const resolvedPath = path.isAbsolute(raw)
    ? raw
    : path.resolve(process.cwd(), raw);

  if (fs.existsSync(resolvedPath)) {
    return fs.readFileSync(resolvedPath, "utf-8");
  }

  return raw.replace(/\\n/g, "\n");
}

/**
 * Generates a GitHub App JWT.
 */
async function getAppJwt(): Promise<string> {
  const formattedKey = getPrivateKey();
  const privateKey = await importPKCS8(formattedKey, "RS256");
  return new SignJWT({
    iss: env.GITHUB_APP_ID,
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 60)
    .setExpirationTime(Math.floor(Date.now() / 1000) + 9 * 60)
    .sign(privateKey);
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
  const appJwt = await getAppJwt();

  // Fetch installation metadata
  const instRes = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Sentinel-API",
      },
    }
  );
  if (!instRes.ok) {
    throw new Error(`Failed to fetch installation metadata: ${instRes.statusText}`);
  }
  const installationData = (await instRes.json()) as any;
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

  // Create Installation Access Token
  const tokenRes = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Sentinel-API",
      },
    }
  );
  if (!tokenRes.ok) {
    throw new Error(`Failed to create installation access token: ${tokenRes.statusText}`);
  }
  const tokenData = (await tokenRes.json()) as any;
  const installationToken = tokenData.token;

  // Fetch accessible repositories
  const reposRes = await fetch(
    `https://api.github.com/installation/repositories`,
    {
      headers: {
        Authorization: `Bearer ${installationToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Sentinel-API",
      },
    }
  );
  if (!reposRes.ok) {
    throw new Error(`Failed to fetch accessible repositories: ${reposRes.statusText}`);
  }
  const reposData = (await reposRes.json()) as any;

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
