import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional
from ai_service.graph.client import Neo4jClient
from ai_service.graph.writer import delete_file_data, upsert_symbols, upsert_call_edges, upsert_import_edges
from ai_service.repo.differ import get_changed_files, get_changed_symbols
from ai_service.parsing.parser import CodeParser
from ai_service.analysis.blast_radius import compute_blast_radius, BlastRadiusResult
from ai_service.analysis.conventions import check_conventions
from ai_service.analysis.decision import make_decision, DecisionResult


@dataclass
class PrEvalResult:
    status: str
    decision: Optional[DecisionResult] = None
    changed_symbols: List[str] = field(default_factory=list)
    duration_seconds: float = 0.0
    errors: List[str] = field(default_factory=list)


async def run_pr_eval_job(
    repo_id: str,
    branch: str,
    repo_dir: str | Path,
    base_ref: str,
    head_ref: str,
    client: Neo4jClient,
) -> PrEvalResult:
    """Flow 2 — Pull Request Evaluation job: incremental graph update -> blast radius -> convention check -> decision gate."""
    start_time = time.time()
    root = Path(repo_dir)

    try:
        changed_files = get_changed_files(root, base_ref, head_ref)
        changed_symbols = get_changed_symbols(root, base_ref, head_ref)

        parser = CodeParser()
        all_symbols = []

        # Update incremental graph data for changed files
        for cf in changed_files:
            rel_path = cf.file_path.replace("\\", "/")
            await delete_file_data(client, repo_id=repo_id, branch=branch, file_path=rel_path)

            if cf.status in ("added", "modified"):
                abs_path = root / cf.file_path
                parse_res = parser.parse_file(abs_path)
                if parse_res:
                    all_symbols.extend(parse_res.symbols)
                    await upsert_symbols(client, repo_id=repo_id, branch=branch, symbols=parse_res.symbols)
                    await upsert_call_edges(client, repo_id=repo_id, branch=branch, calls=parse_res.calls)
                    await upsert_import_edges(client, repo_id=repo_id, branch=branch, imports=parse_res.imports)

        # 1. Blast radius calculation
        blast_radius = await compute_blast_radius(
            client=client,
            repo_id=repo_id,
            branch=branch,
            changed_symbols=changed_symbols,
        )

        # 2. Convention checks
        violations = check_conventions(all_symbols)

        # 3. Decision gate
        decision = make_decision(blast_radius=blast_radius, violations=violations)

        duration = round(time.time() - start_time, 3)
        return PrEvalResult(
            status="SUCCESS",
            decision=decision,
            changed_symbols=changed_symbols,
            duration_seconds=duration,
        )
    except Exception as e:
        return PrEvalResult(status="ERROR", errors=[str(e)])
