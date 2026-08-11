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
        return <Sparkles className="w-4 h-4 text-white" />;
      default:
        return <Terminal className="w-4 h-4 text-zinc-300" />;
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
        return 'border-zinc-700 bg-zinc-800 text-white';
      default:
        return 'border-zinc-800 bg-zinc-900 text-zinc-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Visualizer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-white" />
          <h2 className="font-semibold text-xs tracking-wide text-white uppercase font-mono">
            Agent Tool Execution Pipeline
          </h2>
        </div>
        {totalLatencyMs !== undefined && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-mono text-zinc-300">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>{totalLatencyMs} ms</span>
          </div>
        )}
      </div>

      {isThinking ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-white animate-spin" />
            <Activity className="w-5 h-5 text-white absolute inset-0 m-auto" />
          </div>
          <p className="text-xs font-semibold text-zinc-300">Executing Knowledge Base tools...</p>
          <div className="flex gap-2 text-[11px] text-zinc-500 font-mono">
            <span>Graph Traversal</span> • <span>Vector Retrieval</span> • <span>Gemini Synthesis</span>
          </div>
        </div>
      ) : toolSteps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 gap-2">
          <Terminal className="w-8 h-8 opacity-30" />
          <p className="text-xs font-semibold text-zinc-400">No tool execution trace yet</p>
          <p className="text-[11px]">Ask a question to inspect live multi-tool execution telemetry.</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Pipeline Flowchart / Nodes */}
          <div className="p-4 bg-zinc-900/40 border-b border-zinc-800">
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">
              Executed Sequence ({toolSteps.length} Steps)
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {toolSteps.map((step, idx) => {
                const isSelected = selectedStepId === step.id || (!selectedStepId && idx === 0);
                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setSelectedStepId(step.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800 border-zinc-600 text-white shadow-md'
                          : 'bg-zinc-950 border-zinc-800/90 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div className="p-1 rounded-md bg-black border border-zinc-800">
                        {getToolIcon(step.tool_name)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold leading-none text-zinc-200">
                          {step.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono mt-1">
                          {step.latency_ms}ms
                        </span>
                      </div>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                    </button>
                    {idx < toolSteps.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Selected Tool Step Inspector */}
          {selectedStep && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
              <div className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-black border border-zinc-800">
                    {getToolIcon(selectedStep.tool_name)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{selectedStep.title}</h3>
                    <span
                      className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border mt-0.5 ${getToolBadgeColor(
                        selectedStep.tool_name
                      )}`}
                    >
                      {selectedStep.tool_name}
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-zinc-400">
                  <span className="text-emerald-400 font-semibold text-[11px]">✓ Completed</span>
                  <div className="text-[10px] text-zinc-500">{selectedStep.latency_ms} ms</div>
                </div>
              </div>

              {/* Summary Description */}
              <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80 text-xs text-zinc-300">
                <span className="font-semibold text-zinc-200 block mb-1 font-mono text-[11px]">Execution Summary:</span>
                {selectedStep.summary}
              </div>

              {/* Input Arguments */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide">
                  Input Parameters:
                </span>
                <pre className="bg-black p-3 rounded-xl border border-zinc-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {JSON.stringify(selectedStep.args, null, 2)}
                </pre>
              </div>

              {/* Raw JSON Payload Inspector */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setExpandedJson(!expandedJson)}
                  className="flex items-center justify-between text-[10px] font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  <span className="uppercase tracking-wide">Returned Result Payload:</span>
                  {expandedJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {expandedJson && (
                  <pre className="bg-black p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 max-h-56 overflow-y-auto scrollbar-thin">
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
