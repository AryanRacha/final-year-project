'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchRepo } from '../../../lib/api';

export default function RepoDetails() {
  const params = useParams();
  const id = params?.id;
  const [repo, setRepo] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchRepo(id as string).then(setRepo).catch(console.error);
    }
  }, [id]);

  if (!repo) return <div className="p-8">Loading...</div>;

  // Mocking PRs for now, in a real scenario we'd fetch active PRs from the backend or GitHub API
  const activePRs = [
    { id: '12', title: 'Fix user authentication bug' },
    { id: '15', title: 'Add real-time notifications' }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto mt-10">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-bold tracking-tight">{repo.name}</h1>
        <p className="text-gray-600 mt-2">Status: <span className="font-semibold">{repo.status}</span></p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Active Pull Requests</h2>
      <div className="grid gap-4">
        {activePRs.map(pr => (
          <Link href={`/repo/${repo.repoId}/pr/${pr.id}`} key={pr.id}>
            <div className="border border-gray-200 p-5 rounded-xl hover:shadow-md cursor-pointer bg-white transition-all">
              <span className="font-semibold text-lg">#{pr.id} {pr.title}</span>
              <p className="text-sm text-gray-500 mt-1">Pending AI suggestions</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
