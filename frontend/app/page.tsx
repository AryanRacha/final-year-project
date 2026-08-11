'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ToolStep, Citation, RepoInfo } from './types';
import { ToolVisualizer } from './components/ToolVisualizer';
import { CitationViewer } from './components/CitationViewer';
import { ThinkingBlock } from './components/ThinkingBlock';
import {
  Bot,
  User,
  Send,
  Sparkles,
  GitBranch,
  Database,
  Cpu,
  RefreshCw,
  Zap,
  Code,
  Layers,
  HelpCircle,
  CheckCircle2,
  Terminal,
  Plus,
} from 'lucide-react';

export default function Home() {
  const [repos, setRepos] = useState<string[]>(['final-year-project', 'demo-mern']);
  const [selectedRepo, setSelectedRepo] = useState<string>('final-year-project');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeToolSteps, setActiveToolSteps] = useState<ToolStep[]>([]);
  const [activeLatency, setActiveLatency] = useState<number | undefined>(undefined);

  const [isIngestModalOpen, setIsIngestModalOpen] = useState<boolean>(false);
  const [ingestPath, setIngestPath] = useState<string>('');
  const [ingestRepoId, setIngestRepoId] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch available repositories on load
  useEffect(() => {
    fetchRepos();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchRepos = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/repos');
      if (res.ok) {
        const data: RepoInfo = await res.json();
        if (data.repos && data.repos.length > 0) {
          setRepos(data.repos);
          if (!data.repos.includes(selectedRepo)) {
            setSelectedRepo(data.repos[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Backend server not reachable on load:', e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    const assistantMsgId = `ast_${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      thoughts: [],
      tool_steps: [],
      citations: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);
    setActiveToolSteps([]);
    setActiveLatency(undefined);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_id: selectedRepo,
          message: query,
          branch: 'main',
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const event = JSON.parse(jsonStr);

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== assistantMsgId) return msg;

                const updatedThoughts = [...(msg.thoughts || [])];
                const updatedSteps = [...(msg.tool_steps || [])];
                let updatedContent = msg.content;
                let updatedCitations = msg.citations || [];
                let updatedLatency = msg.total_latency_ms;
                let isStreaming = msg.isStreaming;

                if (event.type === 'thought') {
                  if (event.content && !updatedThoughts.includes(event.content)) {
                    updatedThoughts.push(event.content);
                  }
                } else if (event.type === 'tool_start') {
                  const existingIdx = updatedSteps.findIndex((s) => s.id === event.step_id);
                  const stepObj: ToolStep = {
                    id: event.step_id,
                    step_index: event.step_index,
                    tool_name: event.tool_name,
                    title: event.title,
                    status: 'running',
                    latency_ms: 0,
                    args: event.args || {},
                    summary: 'Executing tool...',
                    raw_output: null,
                  };

                  if (existingIdx >= 0) {
                    updatedSteps[existingIdx] = stepObj;
                  } else {
                    updatedSteps.push(stepObj);
                  }
                  setActiveToolSteps([...updatedSteps]);
                } else if (event.type === 'tool_end') {
                  const existingIdx = updatedSteps.findIndex((s) => s.id === event.step_id);
                  const stepObj: ToolStep = {
                    id: event.step_id,
                    step_index: event.step_index,
                    tool_name: event.tool_name,
                    title: event.title,
                    status: 'completed',
                    latency_ms: event.latency_ms || 0,
                    args: event.args || {},
                    summary: event.summary || '',
                    raw_output: event.raw_output || {},
                  };

                  if (existingIdx >= 0) {
                    updatedSteps[existingIdx] = stepObj;
                  } else {
                    updatedSteps.push(stepObj);
                  }
                  setActiveToolSteps([...updatedSteps]);
                } else if (event.type === 'answer_delta') {
                  updatedContent += event.delta;
                } else if (event.type === 'citations') {
                  updatedCitations = event.citations || [];
                } else if (event.type === 'done') {
                  isStreaming = false;
                  updatedLatency = event.total_latency_ms;
                  setActiveLatency(event.total_latency_ms);
                }

                return {
                  ...msg,
                  thoughts: updatedThoughts,
                  tool_steps: updatedSteps,
                  content: updatedContent,
                  citations: updatedCitations,
                  total_latency_ms: updatedLatency,
                  isStreaming,
                };
              })
            );
          } catch (e) {
            console.warn('Failed to parse SSE payload:', e);
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantMsgId) return msg;
          return {
            ...msg,
            content: `⚠️ Failed to query Knowledge Base: ${err.message || 'Make sure FastAPI server is running at http://127.0.0.1:8000'}`,
            isStreaming: false,
          };
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestRepo = async () => {
    if (!ingestPath.trim() || !ingestRepoId.trim()) return;
    setIsIngesting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ingest', {
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
        alert(`Successfully ingested repository '${ingestRepoId}'! Parsed ${data.files_parsed} files and ${data.symbols_parsed} symbols.`);
        setIsIngestModalOpen(false);
        fetchRepos();
        setSelectedRepo(ingestRepoId);
      } else {
        const err = await res.json();
        alert(`Ingestion failed: ${err.detail || 'Error'}`);
      }
    } catch (e: any) {
      alert(`Ingestion request failed: ${e.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const samplePrompts = [
    'How does hybrid search work in this repository?',
    'What functions and dependencies exist in reviewer.py?',
    'Where is Neo4j client initialized and used?',
    'Show me the full structure of this codebase.',
  ];

  return (
    <div className="flex flex-col h-screen bg-[#090d16] text-slate-100 font-sans overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              CodeBase Knowledge Base AI Agent
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 font-mono text-indigo-300">
                ReAct + Real-Time Stream
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Autonomous Iterative Agent Reasoning, Real-Time Thinking Trace & Citations
            </p>
          </div>
        </div>

        {/* Live System Status Badges & Repo Selector */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Neo4j Graph</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Chroma Vector KB</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gemini 2.0 Flash</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="bg-transparent text-slate-200 font-mono font-medium focus:outline-none cursor-pointer"
              >
                {repos.map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-slate-200">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsIngestModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ingest Repo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Dual Panel Layout */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left Panel: RAG Chat Interface */}
        <div className="flex-1 flex flex-col bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto p-6 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-xl">
                  <Bot className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Ask anything about repository <span className="text-indigo-400 font-mono">'{selectedRepo}'</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    The autonomous agent will think, execute tools iteratively, and stream reasoning trace & cited answers in real time.
                  </p>
                </div>

                {/* Sample Prompt Suggestions */}
                <div className="w-full flex flex-col gap-2 mt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">
                    Suggested Questions:
                  </span>
                  {samplePrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(p)}
                      className="text-left text-xs p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-slate-300 transition-all flex items-center justify-between group"
                    >
                      <span>{p}</span>
                      <Zap className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-3xl flex flex-col rounded-xl p-4 text-xs leading-relaxed shadow-md ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none font-medium'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 opacity-60 font-mono text-[10px]">
                      <span>{msg.role === 'user' ? 'You' : 'KB Assistant'}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Render Expandable Thinking & Step Execution UI Block */}
                    {msg.role === 'assistant' && (
                      <ThinkingBlock
                        thoughts={msg.thoughts}
                        toolSteps={msg.tool_steps}
                        isStreaming={msg.isStreaming}
                        totalLatencyMs={msg.total_latency_ms}
                      />
                    )}

                    {/* Assistant Response Content */}
                    <div className="whitespace-pre-wrap font-sans text-sm mt-1">{msg.content}</div>

                    {/* Citations section if assistant message */}
                    {msg.citations && msg.citations.length > 0 && (
                      <CitationViewer citations={msg.citations} />
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask a question about '${selectedRepo}' codebase...`}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all"
              >
                <span>Ask Agent</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Agent Tool Execution Visualizer */}
        <div className="w-96 md:w-[420px] shrink-0">
          <ToolVisualizer
            toolSteps={activeToolSteps}
            totalLatencyMs={activeLatency}
            isThinking={isLoading}
          />
        </div>
      </div>

      {/* Ingest Repository Modal */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Ingest Repository into Knowledge Base
              </h3>
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Repository ID:</label>
                <input
                  type="text"
                  value={ingestRepoId}
                  onChange={(e) => setIngestRepoId(e.target.value)}
                  placeholder="e.g. final-year-project"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Local Directory Path:</label>
                <input
                  type="text"
                  value={ingestPath}
                  onChange={(e) => setIngestPath(e.target.value)}
                  placeholder="e.g. d:\DOCS\VIT Ebooks\Final Year Project\final-year-project\backend\ai-service"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleIngestRepo}
                disabled={isIngesting || !ingestPath || !ingestRepoId}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {isIngesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing...</span>
                  </>
                ) : (
                  <span>Start Ingestion</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
