'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  Database,
  Plus,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FolderCode,
  Layers,
} from 'lucide-react';

interface RepoManagerProps {
  repos: string[];
  selectedRepo: string;
  onSelectRepo: (repo: string) => void;
}

export const RepoManager: React.FC<RepoManagerProps> = ({
  repos,
  selectedRepo,
  onSelectRepo,
}) => {
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestPath, setIngestPath] = useState('');
  const [ingestRepoId, setIngestRepoId] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  const connectedReposData = [
    {
      id: 'final-year-project',
      fullName: 'aryan/final-year-project',
      branch: 'main',
      status: 'INDEXED',
      symbols: 4892,
      files: 48,
      lastSynced: '2 mins ago',
      isPrivate: true,
    },
    {
      id: 'demo-mern',
      fullName: 'aryan/demo-mern',
      branch: 'main',
      status: 'INDEXED',
      symbols: 1240,
      files: 22,
      lastSynced: '2 hours ago',
      isPrivate: false,
    },
  ];

  const handleIngest = async () => {
    if (!ingestPath.trim() || !ingestRepoId.trim()) return;
    setIsIngesting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000'}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_id: ingestRepoId,
          repo_dir: ingestPath,
          branch: 'main',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully ingested repository '${ingestRepoId}'!`);
        setIsIngestModalOpen(false);
        onSelectRepo(ingestRepoId);
      } else {
        alert('Ingestion failed. Ensure directory exists.');
      }
    } catch (e: any) {
      alert(`Ingestion error: ${e.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleConnectGitHubApp = () => {
    window.open('https://github.com/apps', '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[11px] font-semibold">
              Repository Management
            </span>
            <span className="text-zinc-500 font-mono text-xs">•</span>
            <span className="text-zinc-400 text-xs font-mono">GitHub App Synced</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Connected Repositories & Knowledge Base Indexes
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage repository connections, trigger graph indexing, and configure branch watchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Local Repo</span>
          </button>
          <button
            onClick={handleConnectGitHubApp}
            className="px-3.5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Install GitHub App</span>
          </button>
        </div>
      </div>

      {/* Repositories Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectedReposData.map((repo) => {
          const isSelected = selectedRepo === repo.id;
          return (
            <div
              key={repo.id}
              className={`p-5 rounded-2xl border transition-all shadow-lg flex flex-col justify-between gap-4 ${
                isSelected
                  ? 'bg-zinc-950 border-emerald-500/40 ring-1 ring-emerald-500/20'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                    <GitBranch className="w-4 h-4 text-zinc-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">{repo.fullName}</h3>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      branch: <span className="text-emerald-400">{repo.branch}</span> • {repo.isPrivate ? 'Private' : 'Public'}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {repo.status}
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-900 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block font-mono">Symbols</span>
                  <span className="font-mono font-bold text-white">{repo.symbols}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block font-mono">Files</span>
                  <span className="font-mono font-bold text-white">{repo.files}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block font-mono">Last Index</span>
                  <span className="font-mono text-zinc-300 text-[11px]">{repo.lastSynced}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-500 font-mono">ID: {repo.id}</span>
                <button
                  onClick={() => onSelectRepo(repo.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {isSelected ? 'Active Context' : 'Set as Active'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ingest Modal */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Ingest Codebase into Knowledge Base
              </h3>
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Repository ID:</label>
                <input
                  type="text"
                  value={ingestRepoId}
                  onChange={(e) => setIngestRepoId(e.target.value)}
                  placeholder="e.g. final-year-project"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Local Directory Path:</label>
                <input
                  type="text"
                  value={ingestPath}
                  onChange={(e) => setIngestPath(e.target.value)}
                  placeholder="/path/to/codebase"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="px-3 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleIngest}
                disabled={isIngesting || !ingestPath || !ingestRepoId}
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isIngesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing...</span>
                  </>
                ) : (
                  <span>Start Indexing</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};