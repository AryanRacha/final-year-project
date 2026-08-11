import { App } from 'octokit';

// Replace these with actual values from your GitHub App
const appId = process.env.GITHUB_APP_ID || '';
const privateKey = process.env.GITHUB_PRIVATE_KEY || '';

export const githubApp = new App({
  appId,
  privateKey,
});

export async function getInstallationToken(installationId: number) {
  const octokit = await githubApp.getInstallationOctokit(installationId);
  const { data } = await octokit.rest.apps.createInstallationAccessToken({
    installation_id: installationId,
  });
  return data.token;
}
