import { Elysia, t } from 'elysia';
import { Repository, Suggestion } from './db.js';
import { getInstallationToken } from './github.js';
import { triggerInitJob } from './orchestrator.js';

export const routes = new Elysia()
  .group('/api', (app) => app
    .post('/auth/github/install', async ({ body }) => {
      // Handle github app installation webhook payload
      console.log('GitHub App Installed:', body);
      return { success: true };
    })
    
    .post('/repos/connect', async ({ body }) => {
      const { repoId, name, installationId, cloneUrl } = body as any;
      const repo = new Repository({ repoId, name, installationId, status: 'initializing' });
      await repo.save();
      
      const token = await getInstallationToken(installationId);
      // Trigger python job asynchronously
      triggerInitJob(repoId, cloneUrl, token).catch(console.error);
      
      return { success: true, repo };
    })
    
    .get('/repos', async () => {
      return await Repository.find();
    })
    
    .get('/repos/:id', async ({ params: { id } }) => {
      return await Repository.findOne({ repoId: id });
    })
    
    .delete('/repos/:id', async ({ params: { id } }) => {
      await Repository.deleteOne({ repoId: id });
      return { success: true };
    })
    
    .post('/webhooks/github', async ({ body, headers }) => {
      // Handle PR opened/updated events
      console.log('Webhook received', body);
      return { success: true };
    })
    
    .get('/repos/:id/prs/:prId/suggestions', async ({ params: { id, prId } }) => {
      return await Suggestion.find({ repoId: id, prId });
    })
    
    .post('/repos/:id/prs/:prId/decision', async ({ params: { id, prId }, body }) => {
      const { suggestionId, decision, dismissalReason } = body as any;
      const suggestion = await Suggestion.findById(suggestionId);
      if (suggestion) {
        suggestion.status = decision;
        if (dismissalReason) suggestion.dismissalReason = dismissalReason;
        await suggestion.save();
      }
      return { success: true, suggestion };
    })
  )
  .ws('/ws', {
    message(ws, message) {
      ws.send({ echo: message });
    }
  });
