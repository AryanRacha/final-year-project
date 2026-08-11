"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ToolStep, Citation, RepoInfo } from './types';
import { ToolVisualizer } from './components/ToolVisualizer';
import { CitationViewer } from './components/CitationViewer';
import {
  Sparkles,
  GitBranch,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Layers,
  Code2,
  Terminal,
  Activity,
  CheckCircle2,
  Cpu,
  Lock,
  Search,
  Bot,
  FileCode,
  Flame,
  ChevronRight,
  User,
  LogOut,
} from "lucide-react";

export default function LandingPage() {
  const { user, isAuthenticated, loginWithGithub, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"guard" | "graph" | "agents">(
    "guard",
  );

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

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);
    setActiveToolSteps([]);
    setActiveLatency(undefined);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_id: selectedRepo,
          message: query,
          branch: 'main',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString(),
        citations: data.citations || [],
        tool_steps: data.tool_steps || [],
        total_latency_ms: data.total_latency_ms,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setActiveToolSteps(data.tool_steps || []);
      setActiveLatency(data.total_latency_ms);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Failed to query Knowledge Base: ${err.message || 'Make sure FastAPI server is running at http://127.0.0.1:8000'}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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
                RAG + Visualizer
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive Repository QA & Real-Time Agent Tool Trace
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
              <span>Gemini 2.5 Flash</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-all shadow-md flex items-center gap-1.5"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Log In
                </Link>
                <button
                  onClick={loginWithGithub}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Github className="w-3.5 h-3.5 fill-black" />
                  <span>Start with GitHub</span>
                </button>
              </>
            )}
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
                    The AI agent will query Neo4j Knowledge Graph and Chroma Vector DB to return cited code answers.
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

                    <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>

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

            {isLoading && (
              <div className="flex gap-3 justify-start items-center text-xs text-indigo-400">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  <span>Agent executing tools & querying Knowledge Base...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Window Body */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <button
                onClick={() => setActiveTab("guard")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "guard"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                AI Hallucination Guard
              </button>
              <button
                onClick={() => setActiveTab("graph")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "graph"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Multi-Repo Graph
              </button>
              <button
                onClick={() => setActiveTab("agents")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "agents"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ReAct Fix Agent Trace
              </button>
            </div>

            {/* Display Box */}
            <div className="rounded-xl bg-black border border-zinc-800 p-6 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-sans">
                  {sampleTraces[activeTab].title}
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono text-[10px]">
                  {sampleTraces[activeTab].badge}
                </span>
              </div>

              <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {sampleTraces[activeTab].codeSnippet}
              </pre>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-zinc-400 text-[11px] font-sans">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{sampleTraces[activeTab].detail}</span>
                </div>
                <span className="font-mono text-zinc-500">Latency: 14ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section
        id="features"
        className="relative z-10 max-w-6xl mx-auto px-6 py-20"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Built to Protect Multi-Repo Codebases
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
            As developers write more code with LLM assistants, non-existent
            methods, outdated types, and silent breaking changes proliferate.
            Sentinel acts as a maintenance-first firewall.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:border-zinc-600 transition-colors">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Multi-Repo Graph & Vector Layer
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Indexes symbols, imports, API endpoints, and structural
              dependencies across all your microservices into a unified Neo4j
              knowledge graph and Chroma vector database.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:border-zinc-600 transition-colors">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              AI Code Anti-Hallucination Guard
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Catches LLM-generated code errors before PR merge. Verifies method
              signatures, database queries, and environment variable schema
              contracts against active code.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:border-zinc-600 transition-colors">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Specialised Autonomous Fix Agents
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ReAct loop agents execute targeted tools (symbol search, blast
              radius calculation, hybrid retrieval) to independently investigate
              code issues and write verified patches.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:border-zinc-600 transition-colors">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Real-Time SSE Reasoning & Line Citations
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Watch the agent think line-by-line in real time. Inspect tool
              execution latency, raw JSON parameters, and exact code snippet
              citations with line numbers.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 p-10 md:p-14 text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Ready to secure your multi-repo pipeline?
          </h2>
          <p className="max-w-xl mx-auto text-xs md:text-sm text-zinc-400 leading-relaxed">
            Connect your GitHub repositories in seconds. Zero configuration
            needed. Sentinel starts building your codebase intelligence graph
            immediately.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={loginWithGithub}
              className="px-6 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-all shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <Github className="w-4 h-4 fill-black" />
              <span>Connect with GitHub</span>
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-sm font-medium transition-all"
            >
              Open Sentinel Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Vercel Footer */}
      <footer className="relative z-10 border-t border-zinc-900 bg-black py-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-bold text-xs font-mono">
              S
            </div>
            <span className="text-sm font-semibold text-white">
              Sentinel AI Platform
            </span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>FastAPI + Neo4j</span>
            <span>Chroma Vector KB</span>
            <span>Hono API Service</span>
            <span>Gemini 2.0 Flash</span>
          </div>

          <div>
            © {new Date().getFullYear()} Sentinel AI Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
