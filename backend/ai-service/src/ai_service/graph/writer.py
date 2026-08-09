from typing import List, Optional
from ai_service.graph.client import Neo4jClient
from ai_service.parsing.models import SymbolNode, CallEdge, ImportEdge


async def upsert_symbols(client: Neo4jClient, repo_id: str, branch: str, symbols: List[SymbolNode]) -> int:
    """MERGE Symbol nodes into Neo4j scoped strictly to repo_id and branch."""
    if not symbols:
        return 0

    query = """
    UNWIND $batch AS item
    MERGE (s:Symbol {repo_id: $repo_id, branch: $branch, qualified_name: item.qualified_name})
    SET s.name = item.name,
        s.kind = item.kind,
        s.file_path = item.file_path,
        s.language = item.language,
        s.start_line = item.start_line,
        s.end_line = item.end_line,
        s.signature = item.signature,
        s.docstring = item.docstring
    """

    batch = [
        {
            "qualified_name": sym.qualified_name,
            "name": sym.name,
            "kind": sym.kind,
            "file_path": sym.file_path,
            "language": sym.language,
            "start_line": sym.start_line,
            "end_line": sym.end_line,
            "signature": sym.signature,
            "docstring": sym.docstring,
        }
        for sym in symbols
    ]

    await client.execute_query(query, {"repo_id": repo_id, "branch": branch, "batch": batch})
    return len(symbols)


async def upsert_call_edges(client: Neo4jClient, repo_id: str, branch: str, calls: List[CallEdge]) -> int:
    """MERGE CALLS relationships between caller and callee symbols within the same repo_id."""
    if not calls:
        return 0

    query = """
    UNWIND $batch AS item
    MERGE (caller:Symbol {repo_id: $repo_id, branch: $branch, qualified_name: item.caller_symbol})
    MERGE (callee:Symbol {repo_id: $repo_id, branch: $branch, name: item.callee_name})
    MERGE (caller)-[r:CALLS {file_path: item.file_path, line: item.line}]->(callee)
    """

    batch = [
        {
            "caller_symbol": c.caller_symbol,
            "callee_name": c.callee_name,
            "file_path": c.file_path,
            "line": c.line,
        }
        for c in calls
    ]

    await client.execute_query(query, {"repo_id": repo_id, "branch": branch, "batch": batch})
    return len(calls)


async def upsert_import_edges(client: Neo4jClient, repo_id: str, branch: str, imports: List[ImportEdge]) -> int:
    """MERGE IMPORTS relationships between module files and imported symbols."""
    if not imports:
        return 0

    query = """
    UNWIND $batch AS item
    MERGE (m:Module {repo_id: $repo_id, branch: $branch, file_path: item.importer_file})
    MERGE (s:Symbol {repo_id: $repo_id, branch: $branch, name: item.imported_symbol})
    MERGE (m)-[r:IMPORTS {module_path: item.module_path, line: item.line}]->(s)
    """

    batch = [
        {
            "importer_file": imp.importer_file,
            "imported_symbol": imp.imported_symbol,
            "module_path": imp.module_path,
            "line": imp.line,
        }
        for imp in imports
    ]

    await client.execute_query(query, {"repo_id": repo_id, "branch": branch, "batch": batch})
    return len(imports)


async def delete_file_data(client: Neo4jClient, repo_id: str, branch: str, file_path: str) -> None:
    """Delete nodes and edges belonging to a single file within a repo_id."""
    query = """
    MATCH (s:Symbol {repo_id: $repo_id, branch: $branch, file_path: $file_path})
    DETACH DELETE s
    """
    await client.execute_query(query, {"repo_id": repo_id, "branch": branch, "file_path": file_path})


async def delete_repo_data(client: Neo4jClient, repo_id: str, branch: Optional[str] = None) -> None:
    """Delete all nodes and edges belonging to a specific repo_id (and optional branch)."""
    if branch:
        query = "MATCH (n {repo_id: $repo_id, branch: $branch}) DETACH DELETE n"
        params = {"repo_id": repo_id, "branch": branch}
    else:
        query = "MATCH (n {repo_id: $repo_id}) DETACH DELETE n"
        params = {"repo_id": repo_id}

    await client.execute_query(query, params)
