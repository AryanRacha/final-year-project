# Knowledge-Base-Backed Code Review Service

A knowledge-base-backed code review platform featuring vector & graph knowledge base indexing, agentic PR evaluation, and interactive visualizer.

---

## 🛠️ Prerequisites

Make sure you have the following installed:
- **Docker Desktop** (for Neo4j Graph Database)
- **Bun** runtime (`>= 1.0`)
- **UV** Python package manager (`>= 0.1.0`)
- **Node.js** (`>= 18.0`, optional if using Bun for Next.js frontend)

---

## 🚀 Server Startup Guide

To start the full system, run the commands below for each service in separate terminal windows.

### 1. Neo4j Graph Database (Docker)
Starts the Neo4j Graph database container for graph knowledge storage.

```bash
cd backend/ai-service
docker compose up -d
```
> **Access:** Neo4j Browser will be available at [http://localhost:7474](http://localhost:7474) (Default user: `neo4j`, password: `s3cureP@ssword`).

---

### 2. Python AI Service (FastAPI Server)
Runs the Python backend serving the Chat API, Knowledge Base query engine, and Agent Tool Visualizer endpoint.

```bash
# 1. Navigate to the AI service directory
cd backend/ai-service

# 2. Setup environment variables (if not already done)
cp .env.example .env
# Edit .env to add your GEMINI_API_KEY / GROQ_API_KEY

# 3. Start the HTTP FastAPI server
uv run ai-service serve
```
> **Access:** HTTP API running at [http://127.0.0.1:8000](http://127.0.0.1:8000)

*(Optional MCP Server mode: `uv run ai-service mcp`)*

---

### 3. API Service (Bun Backend)
Runs the Bun control plane API service responsible for GitHub App integrations and workflow management.

```bash
# 1. Navigate to the API service directory
cd backend/api-service

# 2. Install dependencies (first time only)
bun install

# 3. Start the API service server
bun run index.ts
```

---

### 4. Frontend (Next.js App)
Runs the Web UI interface for PR review analysis, citation view, and thinking block tool visualizer.

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies (first time only)
bun install

# 3. Start the Next.js dev server
bun dev
```
> **Access:** Web interface available at [http://localhost:3000](http://localhost:3000)

---

## 💻 CLI Commands (AI Service)

The AI service includes a CLI for repository initialization and PR evaluation:

```bash
cd backend/ai-service

# Initialize & Index a repository (Vector DB + Graph DB)
uv run ai-service init --repo-id my-repo --repo-dir /path/to/repo --branch main

# Evaluate a Pull Request
uv run ai-service eval-pr --repo-id my-repo --repo-dir /path/to/repo --base-ref main --head-ref feature-branch

# Generate HTML visualizer for Knowledge Base graph
uv run ai-service visualize --repo-dir /path/to/repo --output kb_graph.html
```

---

## 🏗️ Architecture Overview

| Service | Stack | Port / Protocol | Role |
|---|---|---|---|
| **Frontend** | Next.js 16, React 19, TailwindCSS | `http://localhost:3000` | User Web Interface |
| **API Service** | Bun, TypeScript | API Control Plane | GitHub App Auth & Control Plane |
| **AI Service** | FastAPI, Python (UV), Gemini / Groq | `http://localhost:8000` | Code Analysis, RAG & Agent Reviewer |
| **Graph DB** | Neo4j Community | `bolt://localhost:7687` | Code Structural Graph KB |
