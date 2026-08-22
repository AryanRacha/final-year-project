'use client';

import React from 'react';
import {
  Activity,
  Database,
  Layers,
  Cpu,
  ShieldCheck,
  GitBranch,
  Flame,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Zap,
  RefreshCw,
  Search,
  Bot,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface MonitoringOverviewProps {
  selectedRepo: string;
  onNavigateTab: (tab: string) => void;
  onSelectHotspotSymbol: (symbol: string) => void;
}

export const MonitoringOverview: React.FC<MonitoringOverviewProps> = ({
  selectedRepo,
  onNavigateTab,
  onSelectHotspotSymbol,
}) => {
  const telemetryStats = [
    {
      label: 'Codebase Health Score',
      value: '98.6%',
      change: '+1.2% this week',
      trend: 'up',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Indexed Code Symbols',
      value: '4,892',
      change: 'Functions, Classes, Modules',
      trend: 'neutral',
      icon: Code2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: 'Neo4j Graph Edges',
      value: '1,240',
      change: 'Calls & Imports Mapped',
      trend: 'up',
      icon: Database,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      label: 'Vector KB Passages',
      value: '520',
      change: 'ChromaDB Cosine Index',
      trend: 'up',
      icon: Layers,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ];

  const subsystemHealth = [
    {
      name: 'Neo4j Graph Database',
      role: 'AST Call/Import Structural Knowledge Graph',
      status: 'Connected',
      latency: '4ms',
      detail: 'bolt://localhost:7687 • Multi-branch scoped graph active',
      stateColor: 'bg-emerald-400',
      tag: 'GraphDB',
    },
    {
      name: 'Chroma Vector Knowledge Base',
      role: 'Semantic Code & Signature Retrieval',
      status: 'Active',
      latency: '12ms',
      detail: 'Collection: symbol_embeddings_v2 • 520 embeddings loaded',
      stateColor: 'bg-emerald-400',
      tag: 'VectorDB',
    },
    {
      name: 'Dual-LLM Agent Core',
      role: 'Google Gemini 2.0 Flash + Groq Orchestration',
      status: 'Ready',
      latency: '180ms',
      detail: 'ReAct Agent Loop with 7 MCP Tools registered',
      stateColor: 'bg-cyan-400',
      tag: 'AI Orchestrator',
    },
    {
      name: 'GitHub App Integration & Webhooks',
      role: 'PR Intake, Repository Sync & Live Event Stream',
      status: 'Listening',
      latency: '<1ms',
      detail: 'Authenticated app installation with repo permissions',
      stateColor: 'bg-purple-400',
      tag: 'GitHub App',
    },
  ];

  const hotspots = [
    {
      symbol: 'AuthContextVariables',
      file: 'backend/api-service/src/middlewares/auth.middleware.ts',
      callers: 18,
      riskLevel: 'CRITICAL',
      riskScore: 0.88,
      reason: 'Central auth context injected into all protected routes.',
    },
    {
      symbol: 'Neo4jClient.execute_query',
      file: 'backend/ai-service/src/ai_service/graph/client.py',
      callers: 14,
      riskLevel: 'HIGH',
      riskScore: 0.74,
      reason: 'Primary database execution channel used across all graph tools.',
    },
    {
      symbol: 'DualLLMClient.plan_tool_calls',
      file: 'backend/ai-service/src/ai_service/agent/llm_client.py',
      callers: 9,
      riskLevel: 'MEDIUM',
      riskScore: 0.58,
      reason: 'Autonomous ReAct tool invocation planner.',
    },
    {
      symbol: 'tool_get_blast_radius',
      file: 'backend/ai-service/src/ai_service/mcp/tools.py',
      callers: 6,
      riskLevel: 'LOW',
      riskScore: 0.32,
      reason: 'Impact analysis tool queried during code change reviews.',
    },
  ];

  const recentEvents = [
    {
      type: 'index',
      title: 'Knowledge Base Synced',
      desc: 'Branch main AST parsed into 4,892 symbols and 1,240 graph edges.',
      time: '2 mins ago',
      badge: 'Index Update',
    },
    {
      type: 'agent',
      title: 'ReAct Agent Session',
      desc: 'Hybrid Search + Blast Radius evaluated query on auth tokens.',
      time: '14 mins ago',
      badge: 'Agent Run',
    },
    {
      type: 'health',
      title: 'Architecture Rules Passed',
      desc: 'No circular file imports detected in backend/api-service.',
      time: '1 hour ago',
      badge: 'Audit Clean',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Vercel Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-950 border border-zinc-800 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-l from-emerald-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Monitoring Active
              </span>
              <span className="text-zinc-500 font-mono text-xs">•</span>
              <span className="text-zinc-400 text-xs font-mono">repo: {selectedRepo} (main)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Codebase Intelligence & System Health
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Real-time telemetry across your Neo4j symbol dependency graph, ChromaDB vector knowledge base, and autonomous ReAct agents.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('agent')}
              className="px-3.5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI Agent</span>
            </button>
            <button
              onClick={() => onNavigateTab('blast_radius')}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Blast</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {telemetryStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-lg flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-400 font-medium">{stat.label}</span>
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.border} border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dual Grid: Subsystems Telemetry + Hotspot Risk Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Subsystems Health Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Subsystems & Knowledge Base Telemetry</h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">4 Services Online</span>
          </div>

          <div className="space-y-3">
            {subsystemHealth.map((sub, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${sub.stateColor} block animate-pulse`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{sub.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                        {sub.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{sub.role}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">{sub.detail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold text-emerald-400">{sub.status}</div>
                    <div className="text-[10px] font-mono text-zinc-500">{sub.latency}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Feed */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Recent Codebase Events & Knowledge Base Syncs</span>
            </h3>
            <div className="space-y-2">
              {recentEvents.map((evt, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <div>
                      <span className="font-semibold text-zinc-200">{evt.title}</span>
                      <span className="text-zinc-400 text-[11px] ml-2 hidden sm:inline">{evt.desc}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 shrink-0">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{evt.badge}</span>
                    <span>{evt.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Codebase Hotspots & Quick Risk Radar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Codebase Hotspots (High Fan-In)</h2>
            </div>
            <button
              onClick={() => onNavigateTab('blast_radius')}
              className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-0.5"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {hotspots.map((spot, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between gap-2 shadow-md group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <span className="text-xs font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {spot.symbol}
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                      {spot.file}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                      spot.riskLevel === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : spot.riskLevel === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    {spot.riskLevel}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-snug">
                  {spot.reason}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[10px] font-mono text-zinc-500">
                  <span>{spot.callers} Callers Dependent</span>
                  <button
                    onClick={() => {
                      onSelectHotspotSymbol(spot.symbol);
                      onNavigateTab('blast_radius');
                    }}
                    className="text-white hover:text-emerald-400 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>Simulate</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900/60 to-zinc-950 border border-zinc-800 space-y-2.5">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Quick Management Actions</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('graph')}
                className="p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-left transition-all cursor-pointer font-medium text-[11px]"
              >
                🕸️ Symbol Graph
              </button>
              <button
                onClick={() => onNavigateTab('quality')}
                className="p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-left transition-all cursor-pointer font-medium text-[11px]"
              >
                🛡️ Quality Rules
              </button>
              <button
                onClick={() => onNavigateTab('repositories')}
                className="p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-left transition-all cursor-pointer font-medium text-[11px]"
              >
                🗂️ Sync Repos
              </button>
              <button
                onClick={() => onNavigateTab('settings')}
                className="p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-left transition-all cursor-pointer font-medium text-[11px]"
              >
                ⚙️ Infra Config
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};