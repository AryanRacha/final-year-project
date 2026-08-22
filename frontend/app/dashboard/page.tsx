'use client';

import GithubIcon from '@/components/GithubIcon';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  Bot,
  ExternalLink,
  CheckCircle2,
  Clock,
  Filter,
  LayoutGrid,
  List,
  RefreshCw,
  Sparkles,
  Lock,
  Globe,
} from 'lucide-react';
import { AddProjectModal } from '@/components/AddProjectModal';
import { useAuth } from '@/context/AuthContext';

interface RepoData {
  id: string;
  name: string;
  fullName?: string;
  default_branch?: string;
  last_commit?: string;
  htmlUrl?: string;
  isPrivate?: boolean;
  source: 'github' | 'local';
  status: 'active' | 'indexing' | 'idle';
}

export default function ProjectsOverviewPage() {
  const { token, isAuthenticated } = useAuth();
  const [repos, setRepos] = useState<RepoData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchAllRepos = async () => {
    setIsLoading(true);
    const repoMap = new Map<string, RepoData>();

    // 1. Fetch connected GitHub App repositories from api-service
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/api/v1/github/repositories`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const gitRepos = data.repositories || [];
        gitRepos.forEach((r: any) => {
          repoMap.set(r.name, {
            id: r.name,
            name: r.name,
            fullName: r.fullName || r.full_name,
            default_branch: r.defaultBranch || r.default_branch || 'main',
            last_commit: 'GitHub App connected & webhook active',
            htmlUrl: r.htmlUrl || r.html_url,
            isPrivate: r.isPrivate || r.is_private || false,
            source: 'github',
            status: 'active',
          });
        });
      }
    } catch (e) {
      console.warn('GitHub repos endpoint check:', e);
    }

    // 2. Fetch indexed repositories from ai-service
    try {
      const aiUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${aiUrl}/api/repos`);
      if (res.ok) {
        const data = await res.json();
        const aiRepos: string[] = data.repos || [];
        aiRepos.forEach((name) => {
          if (!repoMap.has(name)) {
            repoMap.set(name, {
              id: name,
              name: name,
              default_branch: 'main',
              last_commit: 'Indexed code intelligence & agent graph',
              source: 'local',
              status: 'active',
            });
          }
        });
      }
    } catch (e) {
      console.warn('AI service repos endpoint check:', e);
    }

    setRepos(Array.from(repoMap.values()));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllRepos();
  }, [token]);

  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.fullName && r.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-white">All Projects</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
            {repos.length}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Agent Chat</span>
          </Link>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search Projects... [/]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-zinc-800/80 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllRepos}
              className="p-2 rounded-lg bg-[#0a0a0a] border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
              title="Refresh projects"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center bg-[#0a0a0a] border border-zinc-800/80 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid / List */}
        {isLoading && repos.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 rounded-xl bg-[#0a0a0a] border border-zinc-800/80 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-24 h-4 bg-zinc-800 rounded" />
                  <div className="w-40 h-3 bg-zinc-800/60 rounded" />
                </div>
                <div className="w-32 h-3 bg-zinc-800/40 rounded" />
              </div>
            ))}
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800/80 border-dashed max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">No projects found</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                {searchQuery
                  ? `No projects match "${searchQuery}"`
                  : 'Connect your GitHub repositories to enable automated AI PR evaluations and codebase chat.'}
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Repository</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="group relative bg-[#0a0a0a] hover:bg-[#0f0f0f] border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between h-52 shadow-xs"
              >
                {/* Top Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 font-bold shrink-0 group-hover:border-zinc-700 transition-colors">
                        {repo.source === 'github' ? (
                          <GithubIcon className="w-4 h-4 text-white" />
                        ) : (
                          <FolderGit2 className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/projects/${repo.id}`}
                          className="text-sm font-bold text-white hover:text-blue-400 transition-colors truncate block"
                        >
                          {repo.name}
                        </Link>
                        {repo.fullName && (
                          <span className="text-[11px] text-zinc-500 font-mono truncate block">
                            {repo.fullName}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  </div>

                  {/* Branch & Commit info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-mono text-[11px] text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        {repo.default_branch || 'main'}
                      </span>
                      {repo.isPrivate ? (
                        <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          <Lock className="w-2.5 h-2.5" />
                          Private
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          <Globe className="w-2.5 h-2.5" />
                          Public
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {repo.last_commit}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-auto">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/reviews?repo=${repo.id}`}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800/60 transition-colors"
                    >
                      <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
                      <span>PR Reviews</span>
                    </Link>
                    <Link
                      href={`/dashboard/chat?repo=${repo.id}`}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800/60 transition-colors"
                    >
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Chat</span>
                    </Link>
                  </div>
                  <Link
                    href={`/dashboard/projects/${repo.id}`}
                    className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                  >
                    Open &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-zinc-800/80 rounded-xl overflow-hidden divide-y divide-zinc-800/80">
            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="p-4 hover:bg-[#0f0f0f] transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                    {repo.source === 'github' ? (
                      <GithubIcon className="w-4 h-4 text-white" />
                    ) : (
                      <FolderGit2 className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/projects/${repo.id}`}
                      className="text-sm font-semibold text-white hover:text-blue-400 transition-colors truncate block"
                    >
                      {repo.name}
                    </Link>
                    <span className="text-xs text-zinc-500 truncate block">
                      {repo.fullName || repo.last_commit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {repo.default_branch || 'main'}
                  </span>
                  <Link
                    href={`/dashboard/projects/${repo.id}`}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchAllRepos()}
      />
    </div>
  );
}