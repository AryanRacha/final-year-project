import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional
from git import Repo

from ai_service.graph.client import Neo4jClient
from ai_service.graph.schema import ensure_schema
from ai_service.graph.writer import upsert_symbols, upsert_call_edges, upsert_import_edges
from ai_service.vector.client import VectorKBClient
from ai_service.parsing.parser import CodeParser


@dataclass
class InitResult:
    status: str
    symbols_count: int = 0
    edges_count: int = 0
    vector_entries_count: int = 0
    duration_seconds: float = 0.0
    errors: List[str] = field(default_factory=list)


async def run_init_job(
    repo_id: str,
    branch: str,
    repo_dir: str | Path,
    client: Neo4jClient,
    vector_client: Optional[VectorKBClient] = None,
) -> InitResult:
    """Flow 1 — Repository Initialization job: parse AST and ingest dual Knowledge Base into Neo4j and ChromaDB."""
    start_time = time.time()
    root = Path(repo_dir)

    commit_hash = "init"
    try:
        repo = Repo(root, search_parent_directories=True)
        commit_hash = repo.head.commit.hexsha
        repo.close()
    except Exception:
        pass

    if vector_client is None:
        vector_client = VectorKBClient()

    try:
        await ensure_schema(client)

        # Purge existing stale data for this repo_id + branch to prevent duplicates
        from ai_service.graph.writer import delete_repo_data
        await delete_repo_data(client, repo_id=repo_id, branch=branch)
        try:
            vector_client.collection.delete(where={"$and": [{"repo": repo_id}, {"branch": branch}]})
        except Exception:
            pass

        parser = CodeParser()
        parse_results = parser.parse_directory(root)

        total_symbols = 0
        total_edges = 0
        total_vector_entries = 0

        vector_entries = []
        for pr in parse_results:
            if pr.errors:
                return InitResult(status="FAILED", errors=pr.errors)

            s_count = await upsert_symbols(client, repo_id=repo_id, branch=branch, symbols=pr.symbols)
            c_count = await upsert_call_edges(client, repo_id=repo_id, branch=branch, calls=pr.calls)
            i_count = await upsert_import_edges(client, repo_id=repo_id, branch=branch, imports=pr.imports)

            total_symbols += s_count
            total_edges += (c_count + i_count)

            for sym in pr.symbols:
                vector_entries.append({
                    "repo": repo_id,
                    "branch": branch,
                    "file_path": sym.file_path,
                    "symbol": sym.name,
                    "start_line": sym.start_line,
                    "signature": sym.signature,
                    "description": sym.docstring or f"Symbol {sym.name} ({sym.kind}) in {sym.file_path}",
                    "code_body": sym.code_body,
                    "commit_hash": commit_hash,
                })

        # Dual-write into Vector KB in batch
        vector_client.add_code_entries_batch(vector_entries)
        total_vector_entries = len(vector_entries)

        # Run import resolution pass to connect relative imports to actual File and Symbol nodes
        from ai_service.graph.resolver import resolve_repo_imports
        await resolve_repo_imports(client, repo_id=repo_id, branch=branch)

        duration = round(time.time() - start_time, 3)
        return InitResult(
            status="SUCCESS",
            symbols_count=total_symbols,
            edges_count=total_edges,
            vector_entries_count=total_vector_entries,
            duration_seconds=duration,
        )
    except Exception as e:
        return InitResult(status="ERROR", errors=[str(e)])
