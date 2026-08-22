'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Code2,
  FileCode,
  ArrowRight,
  GitBranch,
  Layers,
  ChevronRight,
  Loader2,
  Cpu,
  Flame,
} from 'lucide-react';

interface GraphExplorerProps {
  selectedRepo: string;
  onSimulateBlastRadius?: (symbol: string) => void;
}

export const GraphExplorer: React.FC<GraphExplorerProps> = ({
  selectedRepo,
  onSimulateBlastRadius,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('DualLLMClient');
  const [activeTab, setActiveTab] = useState<'symbols' | 'files'>('symbols');
  const [isLoading, setIsLoading] = useState(false);

  const sampleGraphData = {
    'DualLLMClient': {
      kind: 'Class',
      file: 'backend/ai-service/src/ai_service/agent/llm_client.py',
      signature: 'class DualLLMClient(gemini_key: str, groq_key: str)',
      docstring: 'Dual-LLM orchestrator client managing Gemini 2.0 Flash and Groq fast inference fallbacks.',
      callers: ['AutonomousAgentLoop.run_stream', 'agent_chat_query', 'agent_chat_stream', 'app.py'],
      callees: ['google.genai.Client', 'groq.AsyncGroq', 'plan_tool_calls', 'run_orchestrator'],
      lineStart: 18,
      lineEnd: 110,
    },
    'Neo4jClient': {
      kind: 'Class',
      file: 'backend/ai-service/src/ai_service/graph/client.py',
      signature: 'class Neo4jClient(uri: str = "bolt://localhost:7687")',
      docstring: 'Async client wrapper for Neo4j Graph DB holding code AST nodes and call/import relationships.',
      callers: ['tool_get_symbol_details', 'tool_get_blast_radius', 'tool_get_file_dependencies', 'run_init_job'],
      callees: ['neo4j.AsyncGraphDatabase.driver', 'execute_query', 'verify_connectivity'],
      lineStart: 12,
      lineEnd: 95,
    },
    'compute_blast_radius': {
      kind: 'Function',
      file: 'backend/ai-service/src/ai_service/analysis/blast_radius.py',
      signature: 'async def compute_blast_radius(client: Neo4jClient, repo_id: str, branch: str, changed_symbols: List[str]) -> BlastRadiusResult',
      docstring: 'Traverses downstream CALLS and IMPORTS graph edges recursively to compute ripple effect risk score.',
      callers: ['tool_get_blast_radius', 'ai_service/mcp/tools.py', 'cli.py'],
      callees: ['get_dependents', 'Neo4jClient.execute_query'],
      lineStart: 25,
      lineEnd: 84,
    },
    'AuthContextVariables': {
      kind: 'Interface / Type',
      file: 'backend/api-service/src/middlewares/auth.middleware.ts',
      signature: 'export interface AuthContextVariables { user: User; }',
      docstring: 'Hono context variables definition injected across all JWT-authenticated routes.',
      callers: ['auth.routes.ts', 'github.routes.ts', 'apiRouter'],
      callees: ['User'],
      lineStart: 5,
      lineEnd: 8,
    },
    'syncInstallationRepositories': {
      kind: 'Function',
      file: 'backend/api-service/src/modules/github/github-app.service.ts',
      signature: 'export async function syncInstallationRepositories(installationId: string, userId: string): Promise<ConnectedRepository[]>',
      docstring: 'Generates GitHub App JWT, retrieves accessible repositories, and upserts them to Postgres.',
      callers: ['github.routes.ts -> GET /callback', 'webhooks.ts -> installation_repositories'],
      callees: ['getAppJwt', 'githubInstallations.insert', 'connectedRepositories.onConflictDoUpdate'],
      lineStart: 41,
      lineEnd: 154,
    },
  };

  const symbolList = Object.keys(sampleGraphData);
  const currentSymbol = sampleGraphData[selectedSymbol as keyof typeof sampleGraphData] || sampleGraphData['DualLLMClient'];

  const filteredSymbols = symbolList.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[11px]">
              Neo4j AST Graph Explorer
            </span>
            <span className="text-zinc-500 font-mono text-xs">•</span>
            <span className="text-zinc-400 text-xs font-mono">{selectedRepo}</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Symbol Call Hierarchy & Structural Dependency Graph
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Inspect caller/callee trees, function signatures, and cross-file import connections.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol or function..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors font-mono"
          />
        </div>
      </div>

      {/* Dual Column Explorer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Symbol List */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-semibold text-zinc-400">
            <span>Indexed Symbols ({filteredSymbols.length})</span>
            <span className="text-[10px] font-mono text-zinc-500">Neo4j</span>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredSymbols.map((sym) => {
              const info = sampleGraphData[sym as keyof typeof sampleGraphData];
              const isSelected = selectedSymbol === sym;
              return (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-zinc-900 border-zinc-700 text-white shadow-md'
                      : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold truncate">{sym}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400">
                      {info?.kind || 'Symbol'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono truncate">
                    {info?.file}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Detailed Symbol Inspector */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-2xl space-y-5">
            {/* Symbol Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-mono text-white">{selectedSymbol}</h3>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-mono font-semibold">
                    {currentSymbol.kind}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{currentSymbol.file}</span>
                  <span className="text-zinc-600">:(L{currentSymbol.lineStart}-{currentSymbol.lineEnd})</span>
                </p>
              </div>

              {onSimulateBlastRadius && (
                <button
                  onClick={() => onSimulateBlastRadius(selectedSymbol)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Simulate Blast Radius</span>
                </button>
              )}
            </div>

            {/* Signature & Docstring */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  Signature:
                </span>
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 font-mono text-xs text-emerald-400 overflow-x-auto">
                  <code>{currentSymbol.signature}</code>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  LLM Context Summary & Docstring:
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/40">
                  {currentSymbol.docstring}
                </p>
              </div>
            </div>

            {/* Inbound Callers & Outbound Callees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Callers */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Incoming Callers ({currentSymbol.callers.length})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Dependents</span>
                </div>
                <div className="space-y-1.5">
                  {currentSymbol.callers.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (sampleGraphData[c as keyof typeof sampleGraphData]) {
                          setSelectedSymbol(c);
                        }
                      }}
                      className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="truncate">{c}</span>
                      <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Callees */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Outgoing Dependencies ({currentSymbol.callees.length})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Callees</span>
                </div>
                <div className="space-y-1.5">
                  {currentSymbol.callees.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (sampleGraphData[c as keyof typeof sampleGraphData]) {
                          setSelectedSymbol(c);
                        }
                      }}
                      className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="truncate">{c}</span>
                      <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};