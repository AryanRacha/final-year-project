'use client';

import React, { useState } from 'react';
import { ToolStep } from '../types';
import {
  Cpu,
  Search,
  GitMerge,
  Layers,
  CheckCircle2,
  Clock,
  Code,
  Sparkles,
  Terminal,
  Activity,
  ArrowRight,
  Database,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ToolVisualizerProps {
  toolSteps: ToolStep[];
  totalLatencyMs?: number;
  isThinking?: boolean;
}

export const ToolVisualizer: React.FC<ToolVisualizerProps> = ({
  toolSteps,
  totalLatencyMs,
  isThinking = false,
}) => {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    toolSteps.length > 0 ? toolSteps[0].id : null
  );
  const [expandedJson, setExpandedJson] = useState<boolean>(true);

  const selectedStep = toolSteps.find((s) => s.id === selectedStepId) || toolSteps[0];

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'hybrid_search':
        return <GitMerge className="w-4 h-4 text-cyan-400" />;
      case 'vector_search':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'get_symbol_details':
        return <Code className="w-4 h-4 text-emerald-400" />;
      case 'get_file_dependencies':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'dual_llm_synthesis':
      case 'orchestrator_reasoning':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      default:
        return <Terminal className="w-4 h-4 text-blue-400" />;
    }
  };

  const getToolBadgeColor = (toolName: string) => {
    switch (toolName) {
      case 'hybrid_search':
        return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
      case 'get_symbol_details':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
      case 'get_file_dependencies':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
      case 'dual_llm_synthesis':
        return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300';
      default:
        return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Visualizer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h2 className="font-semibold text-sm tracking-wide text-slate-100 uppercase">
            Agent Tool Execution Pipeline
          </h2>
        </div>
        {totalLatencyMs !== undefined && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{totalLatencyMs} ms total</span>
          </div>
        )}
      </div>

      {isThinking ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <Activity className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
          </div>
          <p className="text-sm font-medium text-slate-300">Agent is executing Knowledge Base tools...</p>
          <div className="flex gap-2 text-xs text-slate-500 font-mono">
            <span>Searching Neo4j Graph</span> • <span>Querying ChromaDB</span> • <span>Gemini Synthesis</span>
          </div>
        </div>
      ) : toolSteps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 gap-2">
          <Terminal className="w-8 h-8 opacity-40" />
          <p className="text-sm font-medium">No tool execution trace yet</p>
          <p className="text-xs">Ask a question to view real-time agent tool pipeline steps.</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Pipeline Flowchart / Nodes */}
          <div className="p-4 bg-slate-900/40 border-b border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Executed Tool Call Sequence ({toolSteps.length} Steps)
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {toolSteps.map((step, idx) => {
                const isSelected = selectedStepId === step.id || (!selectedStepId && idx === 0);
                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setSelectedStepId(step.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all shrink-0 ${
                        isSelected
                          ? 'bg-slate-800 border-indigo-500/80 ring-2 ring-indigo-500/30 text-white shadow-lg'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="p-1 rounded bg-slate-950 border border-slate-800">
                        {getToolIcon(step.tool_name)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold leading-none text-slate-200">
                          {step.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-1">
                          {step.latency_ms}ms
                        </span>
                      </div>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                    </button>
                    {idx < toolSteps.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Selected Tool Step Inspector */}
          {selectedStep && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
              <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-slate-950 border border-slate-800">
                    {getToolIcon(selectedStep.tool_name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{selectedStep.title}</h3>
                    <span
                      className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border mt-0.5 ${getToolBadgeColor(
                        selectedStep.tool_name
                      )}`}
                    >
                      {selectedStep.tool_name}
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold">✓ Completed</span>
                  <div className="text-[11px] text-slate-500">{selectedStep.latency_ms} ms</div>
                </div>
              </div>

              {/* Summary Description */}
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-slate-200 block mb-1">Execution Summary:</span>
                {selectedStep.summary}
              </div>

              {/* Input Arguments */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                  Input Parameters:
                </span>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                  {JSON.stringify(selectedStep.args, null, 2)}
                </pre>
              </div>

              {/* Raw JSON Payload Inspector */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setExpandedJson(!expandedJson)}
                  className="flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  <span className="uppercase tracking-wide">Returned Payload Data:</span>
                  {expandedJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {expandedJson && (
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto scrollbar-thin">
                    {JSON.stringify(selectedStep.raw_output, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
