'use client';

import GithubIcon from '@/components/GithubIcon';

import React, { useState, useEffect } from 'react';
import {
  X,
  FolderGit2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Laptop,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (repoId: string) => void;
}

export function AddProjectModal({ isOpen, onClose, onSuccess }: AddProjectModalProps) {
  const { token } = useAuth();
  const [tab, setTab] = useState<'github' | 'local'>('github');
  const [repoId, setRepoId] = useState('');
  const [repoDir, setRepoDir] = useState('');
  const [branch, setBranch] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [installUrl, setInstallUrl] = useState<string | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  useEffect(() => {
    if (isOpen && tab === 'github') {
      fetchInstallUrl();
    }
  }, [isOpen, tab, token]);

  const fetchInstallUrl = async () => {
    setIsFetchingUrl(true);
    setError(null);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/api/v1/github/install-url`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.installUrl) {
          setInstallUrl(data.installUrl);
        }
      }
    } catch (e) {
      console.warn('Could not fetch GitHub install URL:', e);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  if (!isOpen) return null;

  const handleLocalIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoId.trim() || !repoDir.trim()) {
      setError('Please provide both Project ID and local Repository Directory path.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const aiUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${aiUrl}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_id: repoId.trim(),
          repo_dir: repoDir.trim(),
          branch: branch.trim() || 'main',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Ingestion failed with status ${res.status}`);
      }

      setSuccessMsg(`Project ${repoId} successfully connected and parsed!`);
      setTimeout(() => {
        onSuccess(repoId.trim());
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to connect project. Ensure directory exists and AI service is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubConnect = () => {
    if (installUrl) {
      window.location.href = installUrl;
    } else {
      // Fallback to direct app install link
      window.location.href = 'https://github.com/apps/sentinel-code-guard/installations/new';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#0f0f0f] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-800 rounded-lg text-white">
              <FolderGit2 className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Connect New Project</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 px-5 bg-zinc-950/60">
          <button
            onClick={() => setTab('github')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              tab === 'github'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub App (Recommended)</span>
          </button>
          <button
            onClick={() => setTab('local')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              tab === 'local'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Local Directory</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {tab === 'github' ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black border border-zinc-700 flex items-center justify-center text-white shrink-0">
                    <GithubIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Install Platform GitHub App</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Authorizes automated PR evaluations, webhooks, and one-click fix patches directly in your GitHub repositories.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Automatic webhook synchronization on pull requests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Granular access: select all repositories or only specific ones</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGitHubConnect}
                  disabled={isFetchingUrl}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isFetchingUrl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading GitHub App...</span>
                    </>
                  ) : (
                    <>
                      <GithubIcon className="w-4 h-4 fill-black" />
                      <span>Install / Configure on GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1 text-zinc-600" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLocalIngest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Project Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. final-year-project"
                  value={repoId}
                  onChange={(e) => setRepoId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Repository Directory Path
                </label>
                <input
                  type="text"
                  placeholder="e.g. /home/aryan/coding/projects/final-year-project"
                  value={repoDir}
                  onChange={(e) => setRepoDir(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Default Branch
                </label>
                <input
                  type="text"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors font-sans"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting Codebase...</span>
                    </>
                  ) : (
                    <>
                      <span>Import Repository</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}