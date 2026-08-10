import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from ai_service.graph.client import Neo4jClient
from ai_service.vector.client import VectorKBClient
from ai_service.mcp.tools import tool_get_blast_radius, tool_get_file_dependencies, tool_vector_search
from ai_service.analysis.blast_radius import compute_blast_radius
from ai_service.analysis.conventions import check_conventions, ConventionViolation
from ai_service.analysis.decision import DecisionResult, Verdict, Suggestion
from ai_service.agent.diff_parser import parse_git_diff, DiffHunk
from ai_service.agent.llm_client import DualLLMClient
from ai_service.agent.prompts import (
    SYSTEM_ORCHESTRATOR_PROMPT,
    SYSTEM_WORKER_PROMPT,
    build_orchestrator_prompt,
)


@dataclass
class AgentReviewResult:
    decision: DecisionResult
    agent_rationale: str
    diff_hunks_count: int
    llm_orchestrator_used: bool


async def run_agentic_pr_review(
    client: Neo4jClient,
    repo_id: str,
    branch: str,
    changed_symbols: List[str],
    raw_diff_text: str,
    symbols: list,
    vector_client: Optional[VectorKBClient] = None,
    llm_client: Optional[DualLLMClient] = None,
) -> AgentReviewResult:
    """Execute autonomous agentic PR review using FastMCP knowledge base tools + Gemini/Groq dual LLMs."""
    if llm_client is None:
        llm_client = DualLLMClient()

    if vector_client is None:
        vector_client = VectorKBClient()

    # 1. Parse raw diff text into hunks
    hunks = parse_git_diff(raw_diff_text)
    changed_files = list({h.file_path for h in hunks if h.file_path})

    # 2. Query Knowledge Base via FastMCP tools
    blast_json = await tool_get_blast_radius(client, repo_id=repo_id, changed_symbols=changed_symbols, branch=branch)
    blast_data = json.loads(blast_json)

    # 2b. Retrieve semantic context from Vector KB
    diff_query = raw_diff_text[:400] if raw_diff_text else repo_id
    semantic_json = tool_vector_search(vector_client, query_text=diff_query, repo_id=repo_id, n_results=3)

    # 3. Static convention checks
    violations = check_conventions(symbols)
    violations_dicts = [
        {"rule": v.rule_id, "file": v.file_path, "line": v.line, "msg": v.message, "severity": v.severity}
        for v in violations
    ]

    # 4. Invoke Groq Worker Node for parallel hunk analysis
    worker_prompt = f"Analyze diff hunks:\n{raw_diff_text[:1500]}"
    worker_notes = await llm_client.run_worker(worker_prompt, SYSTEM_WORKER_PROMPT)

    # 5. Invoke Google Gemini Orchestrator for synthesis
    orch_prompt = build_orchestrator_prompt(
        repo_id=repo_id,
        branch=branch,
        changed_files=changed_files,
        changed_symbols=changed_symbols,
        blast_radius_json=blast_json,
        diff_text=raw_diff_text,
        convention_violations=violations_dicts,
        semantic_context=semantic_json,
    )
    orchestrator_response = await llm_client.run_orchestrator(orch_prompt, SYSTEM_ORCHESTRATOR_PROMPT)

    # 6. Formulate final suggestions and decision verdict
    suggestions: List[Suggestion] = []

    # Add convention violations to suggestions
    for v in violations:
        suggestions.append(
            Suggestion(
                file_path=v.file_path,
                line=v.line,
                description=f"[{v.rule_id}] {v.message}",
                category="convention",
                severity=v.severity,
            )
        )

    # Add blast radius structural warning if risk score is high
    risk_score = blast_data.get("risk_score", 0.0)
    total_affected = blast_data.get("total_affected", 0)
    if risk_score > 3.0:
        affected_names = [a.get("qualified_name") for a in blast_data.get("affected_symbols", [])[:3]]
        primary_file = changed_files[0] if changed_files else "PR"
        suggestions.append(
            Suggestion(
                file_path=primary_file,
                line=1,
                description=f"[BLAST_RADIUS] Ripple effect risk score: {risk_score}. Affects {total_affected} downstream symbols: {', '.join(affected_names)}",
                category="blast_radius",
                severity="warning",
            )
        )

    # Determine verdict
    has_high_risk = risk_score > 5.0
    has_errors = any(s.severity == "error" for s in suggestions)
    verdict: Verdict = "SUGGEST" if (has_high_risk or has_errors or len(suggestions) > 0) else "ACCEPT"

    summary_text = (
        f"Agentic Review Verdict: {verdict}. Risk score: {risk_score}. "
        f"{len(suggestions)} suggestion(s) generated."
    )

    decision = DecisionResult(
        verdict=verdict,
        risk_score=risk_score,
        suggestions=suggestions,
        summary=summary_text,
    )

    return AgentReviewResult(
        decision=decision,
        agent_rationale=orchestrator_response,
        diff_hunks_count=len(hunks),
        llm_orchestrator_used=llm_client.has_gemini,
    )
