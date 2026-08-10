import json
from typing import Any, Dict, List
from ai_service.graph.client import Neo4jClient
from ai_service.graph.reader import get_symbol, get_dependents, get_dependencies, get_all_symbols
from ai_service.analysis.blast_radius import compute_blast_radius
from ai_service.analysis.conventions import check_conventions
from ai_service.parsing.parser import CodeParser


async def tool_get_repo_structure(client: Neo4jClient, repo_id: str, branch: str = "main") -> str:
    """Retrieve full file and symbol hierarchy for a repository."""
    query = """
    MATCH (f:File {repo_id: $repo_id, branch: $branch})
    OPTIONAL MATCH (f)-[:DEFINES]->(s:Symbol)
    RETURN f.file_path AS file_path, f.language AS language, collect({name: s.name, kind: s.kind, qname: s.qualified_name}) AS symbols
    ORDER BY file_path
    """
    records = await client.execute_query(query, {"repo_id": repo_id, "branch": branch})
    return json.dumps({"repo_id": repo_id, "branch": branch, "files": records}, indent=2)


async def tool_get_symbol_details(client: Neo4jClient, repo_id: str, qualified_name: str, branch: str = "main") -> str:
    """Retrieve detailed properties, callers, and callees for a given symbol qualified_name."""
    sym = await get_symbol(client, repo_id, branch, qualified_name)
    if not sym:
        return json.dumps({"error": f"Symbol '{qualified_name}' not found in repo '{repo_id}'"})

    name = sym.get("name", "")
    dependents = await get_dependents(client, repo_id, branch, callee_name=name)
    dependencies = await get_dependencies(client, repo_id, branch, caller_qualified_name=qualified_name)

    return json.dumps({
        "symbol": sym,
        "callers": dependents,
        "callees": dependencies
    }, indent=2)


async def tool_get_blast_radius(client: Neo4jClient, repo_id: str, changed_symbols: List[str], branch: str = "main") -> str:
    """Compute downstream ripple effect risk score and affected symbols for a list of changed symbol qualified names."""
    res = await compute_blast_radius(client, repo_id, branch, changed_symbols)
    return json.dumps({
        "risk_score": res.risk_score,
        "total_affected": res.total_affected,
        "changed_symbols": res.changed_symbols,
        "affected_symbols": [
            {"qualified_name": a.qualified_name, "file_path": a.file_path, "depth": a.depth, "fan_in": a.fan_in}
            for a in res.affected_symbols
        ]
    }, indent=2)


async def tool_get_file_dependencies(client: Neo4jClient, repo_id: str, file_path: str, branch: str = "main") -> str:
    """Get internal and external dependencies for a file, plus other files that depend on it."""
    # Inbound file dependencies (who imports this file)
    inbound_query = """
    MATCH (other:File {repo_id: $repo_id, branch: $branch})-[:DEPENDS_ON_FILE]->(f:File {repo_id: $repo_id, branch: $branch, file_path: $file_path})
    RETURN other.file_path AS importing_file
    """
    inbound_recs = await client.execute_query(inbound_query, {"repo_id": repo_id, "branch": branch, "file_path": file_path})

    # Outbound file dependencies (what this file imports)
    outbound_file_query = """
    MATCH (f:File {repo_id: $repo_id, branch: $branch, file_path: $file_path})-[:DEPENDS_ON_FILE]->(target:File {repo_id: $repo_id, branch: $branch})
    RETURN target.file_path AS imported_file
    """
    outbound_file_recs = await client.execute_query(outbound_file_query, {"repo_id": repo_id, "branch": branch, "file_path": file_path})

    # Outbound external package dependencies
    outbound_pkg_query = """
    MATCH (f:File {repo_id: $repo_id, branch: $branch, file_path: $file_path})-[:DEPENDS_ON]->(pkg:Package {repo_id: $repo_id, branch: $branch})
    RETURN pkg.name AS package_name
    """
    outbound_pkg_recs = await client.execute_query(outbound_pkg_query, {"repo_id": repo_id, "branch": branch, "file_path": file_path})

    return json.dumps({
        "file_path": file_path,
        "imported_by_files": [r["importing_file"] for r in inbound_recs],
        "imports_files": [r["imported_file"] for r in outbound_file_recs],
        "external_packages": [r["package_name"] for r in outbound_pkg_recs]
    }, indent=2)


async def tool_search_symbols(client: Neo4jClient, repo_id: str, query_str: str, branch: str = "main") -> str:
    """Fuzzy search symbol names matching query string."""
    query = """
    MATCH (s:Symbol {repo_id: $repo_id, branch: $branch})
    WHERE toLower(s.name) CONTAINS toLower($query_str) OR toLower(s.qualified_name) CONTAINS toLower($query_str)
    RETURN properties(s) AS symbol
    LIMIT 20
    """
    records = await client.execute_query(query, {"repo_id": repo_id, "branch": branch, "query_str": query_str})
    return json.dumps([r["symbol"] for r in records if "symbol" in r], indent=2)
