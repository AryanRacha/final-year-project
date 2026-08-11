const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchRepos() {
  const res = await fetch(`${API_URL}/repos`);
  if (!res.ok) throw new Error('Failed to fetch repos');
  return res.json();
}

export async function fetchRepo(id: string) {
  const res = await fetch(`${API_URL}/repos/${id}`);
  if (!res.ok) throw new Error('Failed to fetch repo');
  return res.json();
}

export async function fetchSuggestions(repoId: string, prId: string) {
  const res = await fetch(`${API_URL}/repos/${repoId}/prs/${prId}/suggestions`);
  if (!res.ok) throw new Error('Failed to fetch suggestions');
  return res.json();
}

export async function submitDecision(repoId: string, prId: string, suggestionId: string, decision: 'accepted' | 'denied', dismissalReason?: string) {
  const res = await fetch(`${API_URL}/repos/${repoId}/prs/${prId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestionId, decision, dismissalReason })
  });
  if (!res.ok) throw new Error('Failed to submit decision');
  return res.json();
}
