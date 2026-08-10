import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List
from ai_service.graph.client import Neo4jClient
from ai_service.graph.schema import ensure_schema
from ai_service.graph.writer import upsert_symbols, upsert_call_edges, upsert_import_edges
from ai_service.parsing.parser import CodeParser


@dataclass
class InitResult:
    status: str
    symbols_count: int = 0
    edges_count: int = 0
    duration_seconds: float = 0.0
    errors: List[str] = field(default_factory=list)


async def run_init_job(
    repo_id: str,
    branch: str,
    repo_dir: str | Path,
    client: Neo4jClient,
) -> InitResult:
    """Flow 1 — Repository Initialization job: parse AST and ingest vectorless Knowledge Base into Neo4j."""
    start_time = time.time()
    root = Path(repo_dir)

    try:
        await ensure_schema(client)
        parser = CodeParser()
        parse_results = parser.parse_directory(root)

        total_symbols = 0
        total_edges = 0

        for pr in parse_results:
            if pr.errors:
                return InitResult(status="FAILED", errors=pr.errors)

            s_count = await upsert_symbols(client, repo_id=repo_id, branch=branch, symbols=pr.symbols)
            c_count = await upsert_call_edges(client, repo_id=repo_id, branch=branch, calls=pr.calls)
            i_count = await upsert_import_edges(client, repo_id=repo_id, branch=branch, imports=pr.imports)

            total_symbols += s_count
            total_edges += (c_count + i_count)

        # Run import resolution pass to connect relative imports to actual File and Symbol nodes
        from ai_service.graph.resolver import resolve_repo_imports
        await resolve_repo_imports(client, repo_id=repo_id, branch=branch)

        duration = round(time.time() - start_time, 3)
        return InitResult(
            status="SUCCESS",
            symbols_count=total_symbols,
            edges_count=total_edges,
            duration_seconds=duration,
        )
    except Exception as e:
        return InitResult(status="ERROR", errors=[str(e)])
