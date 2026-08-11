'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchSuggestions, submitDecision } from '../../../../lib/api';

export default function PRReview() {
  const params = useParams();
  const id = params?.id;
  const prId = params?.prId;
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (id && prId) {
      fetchSuggestions(id as string, prId as string).then(setSuggestions).catch(console.error);
    }
  }, [id, prId]);

  const handleDecision = async (suggestionId: string, decision: 'accepted' | 'denied') => {
    let reason = undefined;
    if (decision === 'denied') {
      reason = prompt('Reason for dismissal (optional):') || undefined;
    }
    try {
      await submitDecision(id as string, prId as string, suggestionId, decision, reason);
      // Refresh list
      const fresh = await fetchSuggestions(id as string, prId as string);
      setSuggestions(fresh);
    } catch (e) {
      console.error(e);
      alert("Failed to submit decision");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto mt-10">
      <Link href={`/repo/${id}`} className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Repository</Link>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Review Suggestions for PR #{prId}</h1>

      {suggestions.length === 0 && (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 font-medium">No pending suggestions for this PR.</p>
        </div>
      )}

      <div className="grid gap-6">
        {suggestions.map(s => (
          <div key={s._id} className="border border-gray-200 p-5 rounded-xl bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{s.filePath}</h3>
                <p className="text-sm text-gray-500">Line: {s.line}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${
                s.status === 'accepted' ? 'bg-green-100 text-green-800' :
                s.status === 'denied' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {s.status}
              </span>
            </div>
            
            <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm mb-4">
              <code>{s.diff}</code>
            </pre>
            
            {s.status === 'pending' && (
              <div className="flex gap-3">
                <button 
                  onClick={() => handleDecision(s._id, 'accepted')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Accept Patch
                </button>
                <button 
                  onClick={() => handleDecision(s._id, 'denied')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Dismiss / Deny
                </button>
              </div>
            )}
            
            {s.dismissalReason && (
              <div className="mt-4 p-3 bg-red-50 text-red-800 rounded border border-red-200 text-sm">
                <strong>Dismissal Reason:</strong> {s.dismissalReason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
