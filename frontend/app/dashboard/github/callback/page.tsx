'use client';

import GithubIcon from '@/components/GithubIcon';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GitHubCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const installationId = searchParams.get('installation_id');
  const setupAction = searchParams.get('setup_action');

  const [status, setStatus] = useState<'syncing' | 'success' | 'error'>('syncing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    const syncRepos = async () => {
      if (!installationId) {
        setStatus('error');
        setErrorMsg('No installation_id found in the callback URL.');
        return;
      }

      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
        const res = await fetch(
          `${apiBase}/api/v1/github/callback?installation_id=${installationId}&setup_action=${setupAction || 'install'}`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Sync failed with HTTP status ${res.status}`);
        }

        setStatus('success');
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1500);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Failed to synchronize GitHub App repositories.');
      }
    };

    syncRepos();
  }, [installationId, setupAction, token, isAuthLoading, router]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl bg-[#0f0f0f] border border-zinc-800 p-8 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-white">
          <GithubIcon className="w-6 h-6" />
        </div>

        {status === 'syncing' && (
          <div className="space-y-2">
            <h2 className="text-base font-bold text-white">Syncing GitHub Repositories</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Registering your GitHub App installation and synchronizing accessible repositories...
            </p>
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">GitHub Connected!</h2>
            <p className="text-xs text-zinc-400">
              Repositories successfully synced. Redirecting to your dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">Sync Failed</h2>
            <p className="text-xs text-red-400">{errorMsg}</p>
            <button
              onClick={() => router.replace('/dashboard')}
              className="px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}