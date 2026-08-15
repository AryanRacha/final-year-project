'use client';

import React, { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  GitBranch,
  Search,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';

interface BlastRadiusViewProps {
  selectedRepo: string;
  initialSymbol?: string;
}

export const BlastRadiusView: React.FC<BlastRadiusViewProps> = ({
  selectedRepo,
  initialSymbol = 'AuthContextVariables',
}) => {
  const [symbolInput, setSymbolInput] = useState(initialSymbol);
  const [analyzedSymbol, setAnalyzedSymbol] = useState(initialSymbol);
  const [isSimulating, setIsSimulating] = useState(false);

  const mockSimulations: Record<string, any> = {
    'AuthContextVariables': {
      riskScore: 0.88,
      riskLevel: 'CRITICAL',
      totalAffected: 18,
      maxDepth: 4,
      affectedSymbols: [
        { name: 'authMiddleware', file: 'backend/api-service/src/middlewares/auth.middleware.ts', depth: 1, fanIn: 12 },
        { name: 'authRouter.get("/me")', file: 'backend/api-service/src/modules/auth/auth.routes.ts', depth: 2, fanIn: 8 },
        { name: 'authRouter.post("/logout")', file: 'backend/api-service/src/modules/auth/auth.routes.ts', depth: 2, fanIn: 4 },
        { name: 'githubRouter.get("/repositories")', file: 'backend/api-service/src/modules/github/github.routes.ts', depth: 3, fanIn: 6 },
        { name: 'githubRouter.get("/install-url")', file: 'backend/api-service/src/modules/github/github.routes.ts', depth: 3, fanIn: 5 },
        { name: 'githubRouter.delete("/repositories/:id")', file: 'backend/api-service/src/modules/github/github.routes.ts', depth: 4, fanIn: 3 },
      ],
      safetyRecommendation: 'Changing AuthContextVariables modifies session authentication across all API endpoints. Run full test suite before committing.',
    },
    'Neo4jClient': {
      riskScore: 0.74,
      riskLevel: 'HIGH',
      totalAffected: 14,
      maxDepth: 3,
      affectedSymbols: [
        { name: 'tool_get_symbol_details', file: 'backend/ai-service/src/ai_service/mcp/tools.py', depth: 1, fanIn: 7 },
        { name: 'tool_get_blast_radius', file: 'backend/ai-service/src/ai_service/mcp/tools.py', depth: 1, fanIn: 6 },
        { name: 'tool_hybrid_search', file: 'backend/ai-service/src/ai_service/mcp/tools.py', depth: 2, fanIn: 9 },
        { name: 'AutonomousAgentLoop.run_stream', file: 'backend/ai-service/src/ai_service/agent/agent_loop.py', depth: 3, fanIn: 11 },
      ],
      safetyRecommendation: 'Modifying Neo4jClient signature impacts all Graph MCP tool executions. Verify connection pooling.',
    },
    'default': {
      riskScore: 0.35,
      riskLevel: 'LOW',
      totalAffected: 4,
      maxDepth: 2,
      affectedSymbols: [
        { name: 'helperFunction', file: 'backend/ai-service/src/ai_service/utils.py', depth: 1, fanIn: 2 },
        { name: 'test_utils.py', file: 'backend/ai-service/tests/test_utils.py', depth: 2, fanIn: 1 },
      ],
      safetyRecommendation: 'Low blast radius detected. Safe to modify with standard unit tests pass.',
    },
  };

  const currentResult = mockSimulations[analyzedSymbol] || mockSimulations['default'];

  const handleSimulate = () => {
    if (!symbolInput.trim()) return;
    setIsSimulating(true);
    setTimeout(() => {
      setAnalyzedSymbol(symbolInput.trim());
      setIsSimulating(false);
    }, 400);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px] font-semibold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Downstream Ripple Impact Simulator
              </span>
              <span className="text-zinc-500 font-mono text-xs">•</span>
              <span className="text-zinc-400 text-xs font-mono">{selectedRepo}</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Blast Radius Analysis & Breaking Change Prevention
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Simulate modifying a symbol to inspect downstream dependents and calculate risk before refactoring.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              placeholder="e.g. AuthContextVariables"
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono w-full md:w-64"
            />
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="px-4 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
            >
              {isSimulating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Flame className="w-3.5 h-3.5" />
              )}
              <span>Calculate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Risk Score */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-md flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">Ripple Risk Score</span>
          <div className="flex items-baseline gap-3 my-2">
            <span className="text-3xl font-mono font-bold text-white">
              {(currentResult.riskScore * 100).toFixed(0)}%
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getRiskColor(currentResult.riskLevel)}`}>
              {currentResult.riskLevel}
            </span>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                currentResult.riskLevel === 'CRITICAL'
                  ? 'bg-rose-500'
                  : currentResult.riskLevel === 'HIGH'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${currentResult.riskScore * 100}%` }}
            />
          </div>
        </div>

        {/* Affected Symbols */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-md flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">Downstream Affected Symbols</span>
          <div className="text-3xl font-mono font-bold text-white my-2">
            {currentResult.totalAffected}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Across functions, routes & services
          </span>
        </div>

        {/* Traversal Depth */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-md flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">Max Call Graph Depth</span>
          <div className="text-3xl font-mono font-bold text-white my-2">
            {currentResult.maxDepth} Levels
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Recursive downstream AST cascade
          </span>
        </div>
      </div>

      {/* Recommendations Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-400">Architectural Precaution: </span>
          <span className="text-zinc-300">{currentResult.safetyRecommendation}</span>
        </div>
      </div>

      {/* Affected Symbols Tree Table */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-xs font-bold text-white font-mono">
            Target: <span className="text-emerald-400">{analyzedSymbol}</span> • Downstream Impact List
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">Sorted by Call Depth</span>
        </div>

        <div className="space-y-2">
          {currentResult.affectedSymbols.map((item: any, i: number) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px] font-bold flex items-center justify-center">
                  D{item.depth}
                </span>
                <div>
                  <span className="text-xs font-mono font-bold text-white">{item.name}</span>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.file}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-[11px] font-mono text-zinc-400">
                  {item.fanIn} dependent calls
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
