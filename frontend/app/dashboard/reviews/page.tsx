'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  FolderGit2,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  GitBranch,
} from 'lucide-react';

interface PREvaluation {
  id: string;
  pr_number: number;
  title: string;
  repo_id: string;
  branch: string;
  author: string;
  status: 'passed' | 'suggested' | 'evaluating';
  blast_radius_risk: 'low' | 'medium' | 'high';
  violations_count: number;
  created_at: string;
  patch_diff?: string;
}

export default function PRReviewsPage() {
  const searchParams = useSearchParams();
  const repoParam = searchParams.get('repo');

  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>(repoParam || 'all');
  const [activePR, setActivePR] = useState<PREvaluation | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const aiUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${aiUrl}/api/repos`);
        if (res.ok) {
          const data = await res.json();
          if (data.repos) {
            setRepos(data.repos);
          }
        }
      } catch (e) {
        console.warn('Could not fetch repos:', e);
      }
    };
    fetchRepos();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-purple-400" />
            <h1 className="text-sm font-semibold text-white">PR Review Agent</h1>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Autonomous
          </span>
        </div>

        {/* Filter by repo */}
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white px-2.5 py-1 focus:outline-none focus:border-zinc-700"
          >
            <option value="all">All Projects</option>
            {repos.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
        <div className="rounded-xl bg-[#0a0a0a] border border-zinc-800/80 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white">Automated PR Agent Pipeline</h2>
              <p className="text-xs text-zinc-400 max-w-xl">
                Every incoming pull request is inspected for ripple-effect blast radius, convention violations, and sandboxed test executions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                <span>Webhooks Active</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Blast Radius Check</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Downstream impact and risk score analysis via code call graph.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Convention Checks</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Matches AST nodes against repository patterns and architectural rules.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>One-Click Fix Patches</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Generates diff patches ready to apply directly to the PR branch.
              </p>
            </div>
          </div>
        </div>

        {/* Empty state / Live listening prompt */}
        <div className="text-center py-16 px-4 rounded-xl bg-[#0a0a0a] border border-zinc-800/80 border-dashed space-y-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-purple-400">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Listening for Pull Requests</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              When a pull request is opened on any connected GitHub repository, the agent will automatically evaluate it and present the findings here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}