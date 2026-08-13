"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Github from "@/app/components/GithubIcon";
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

  const sampleTraces = {
    guard: {
      title: "AI Code Quality & Hallucination Inspection",
      codeSnippet: `// ⚠️ Detected AI-generated code snippet in api-service/src/routes/auth.routes.ts
const user = await db.queryUser(code); 
// CRITICAL WARNING: AI assumed 'db.queryUser' exists, but Neo4j symbol graph shows
// method was renamed to 'userRepository.findByOAuthId()' in commit e4f912a.`,
      status: "BLOCKED BEFORE MERGE",
      badge: "Anti-Hallucination Guard active",
      detail: "Prevented runtime TypeError across 3 dependent microservices.",
    },
    graph: {
      title: "Multi-Repo Intelligence Dependency Graph",
      codeSnippet: `Graph Traversal Path:
[frontend] -> POST /api/v1/auth/github/callback 
  └─> [api-service] -> githubAuthService.handleCallback()
        └─> [ai-service] -> gRPC /vector/embed_symbol
              └─> [ChromaDB] -> Collection: 'symbol_embeddings_v2'`,
      status: "GRAPH SYNCHRONIZED",
      badge: "Neo4j + Vector Hybrid Index",
      detail: "Resolved 142 cross-repo symbol dependencies in 18ms.",
    },
    agents: {
      title: "Autonomous ReAct Agent Blast-Radius Fix",
      codeSnippet: `Agent Step 1: get_blast_radius(symbol="AuthContextVariables")
Agent Step 2: hybrid_search("JWT token verification fallback")
Agent Step 3: Generated patch for 4 files with 100% type assertion pass.`,
      status: "PATCH VERIFIED",
      badge: "Iterative Tool Pipeline",
      detail:
        "Specialised agent investigated, tested, and resolved code issue.",
    },
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden">
      {/* Top Background Gradient Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-125 bg-linear-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />

      {/* Vercel Header Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm font-mono shadow-md group-hover:scale-105 transition-transform">
                S
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Sentinel AI
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
              <a
                href="#features"
                className="hover:text-white transition-colors"
              >
                Features
              </a>
              <a href="#preview" className="hover:text-white transition-colors">
                Architecture
              </a>
              <a
                href="#guardrails"
                className="hover:text-white transition-colors"
              >
                AI Guardrails
              </a>
              <a href="#demo" className="hover:text-white transition-colors">
                Live Pipeline
              </a>
            </nav>
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

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400">Maintenance-First Platform</span>
          <span className="text-zinc-600">•</span>
          <span className="text-white font-semibold">
            Catch AI Code Before Production
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
          The Intelligence Layer for <br />
          <span className="bg-linear-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
            Multi-Repo Projects
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm md:text-base text-zinc-400 leading-relaxed mb-10">
          Build an intelligent structural layer over your repositories.
          Specialised agents investigate, review, and fix code — catching
          AI-generated hallucinations, API mismatches, and regressions before
          merge.
        </p>

        {/* CTA Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={loginWithGithub}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Github className="w-4 h-4 fill-black" />
            <span>Connect GitHub Repository</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Dashboard</span>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </Link>
        </div>

        {/* Live Metrics Strip */}
        <div className="mt-14 pt-8 border-t border-zinc-900 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div>
            <div className="text-xl font-bold font-mono text-white">
              Multi-Repo
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Cross-service Symbol Graph
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              0% Regressions
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              AI Code Verification Filter
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-purple-400">
              ReAct Pipeline
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Iterative Investigation Tools
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              Real-Time
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              SSE Reasoning & Citations
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Window Preview Showcase */}
      <section
        id="preview"
        className="relative z-10 max-w-6xl mx-auto px-6 py-12"
      >
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
          {/* Top Bar Window Chrome */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-800" />
              <div className="w-3 h-3 rounded-full bg-zinc-800" />
              <div className="w-3 h-3 rounded-full bg-zinc-800" />
              <span className="ml-2 text-zinc-400">
                sentinel-intelligence-layer // live-monitor
              </span>
            </div>
            <div className="flex items-center gap-4 text-zinc-500">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Agent Guard
              </span>
              <span>Neo4j v5.12</span>
              <span>Chroma Vector KB</span>
            </div>
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
        <div className="rounded-3xl bg-linear-to-b from-zinc-900 to-black border border-zinc-800 p-10 md:p-14 text-center space-y-6 shadow-2xl">
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
