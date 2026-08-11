const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function triggerInitJob(repoId: string, cloneUrl: string, token: string) {
  try {
    const res = await fetch(`${PYTHON_SERVICE_URL}/api/v1/jobs/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoId, cloneUrl, token })
    });
    return await res.json();
  } catch (error) {
    console.error('Error triggering init job:', error);
    throw error;
  }
}

export async function triggerPrEvalJob(repoId: string, prId: string, diff: string, token: string) {
  try {
    const res = await fetch(`${PYTHON_SERVICE_URL}/api/v1/jobs/pr_eval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoId, prId, diff, token })
    });
    return await res.json();
  } catch (error) {
    console.error('Error triggering PR eval job:', error);
    throw error;
  }
}
