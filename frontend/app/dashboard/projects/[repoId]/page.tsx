'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderGit2,
  GitBranch,
  GitPullRequest,
  Bot,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const repoId = typeof params?.repoId === 'string' ? params.repoId : '';

  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'chat'>('overview');
  const [isReindexing, setIsReindexing] = useState(false);

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const aiUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000';
      await fetch(`${aiUrl}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_id: repoId,
          repo_dir: `/home/aryan/coding/projects/${repoId}`,
          branch: 'main',
        }),
      });
    } catch (e) {
      console.warn('Reindex triggered:', e);
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Project Subheader */}
      <header className="border-b border-zinc-800/80 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Back to Projects"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-blue-400" />
              <h1 className="text-sm font-bold text-white">{repoId}</h1>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                main
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReindex}
              disabled={isReindexing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin' : ''}`} />
              <span>{isReindexing ? 'Re-indexing...' : 'Sync & Re-index'}</span>
            </button>
          </div>
        </div>

        {/* Feature Tabs */}
        <div className="px-6 flex gap-6 text-xs font-medium border-t border-zinc-800/40">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview
          </button>
          <Link
            href={`/dashboard/reviews?repo=${repoId}`}
            className="py-2.5 border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
            <span>PR Review Agent</span>
          </Link>
          <Link
            href={`/dashboard/chat?repo=${repoId}`}
            className="py-2.5 border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>Codebase Chat</span>
          </Link>
        </div>
      </header>

      {/* Main Tab Content */}
      <div className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#0a0a0a] border border-zinc-800/80 p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <GitPullRequest className="w-4 h-4 text-purple-400" />
              <span>PR Review Agent</span>
            </div>
            <p className="text-xs text-zinc-400">
              Evaluates pull requests on {repoId}, checks blast radius and rules, and suggests fix commits.
            </p>
            <Link
              href={`/dashboard/reviews?repo=${repoId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>Open PR Reviews &rarr;</span>
            </Link>
          </div>

          <div className="rounded-xl bg-[#0a0a0a] border border-zinc-800/80 p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Codebase Chat</span>
            </div>
            <p className="text-xs text-zinc-400">
              Ask questions about {repoId} architecture, routes, or dependencies with real-time reasoning and citations.
            </p>
            <Link
              href={`/dashboard/chat?repo=${repoId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>Launch Chat &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}