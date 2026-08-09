from typing import Any, Dict, List, Optional
from ai_service.graph.client import Neo4jClient


async def get_symbol(client: Neo4jClient, repo_id: str, branch: str, qualified_name: str) -> Optional[Dict[str, Any]]:
    """Fetch a single symbol node by qualified_name within repo_id."""
    query = """
    MATCH (s:Symbol {repo_id: $repo_id, branch: $branch, qualified_name: $qualified_name})
    RETURN properties(s) AS symbol
    """
    records = await client.execute_query(query, {"repo_id": repo_id, "branch": branch, "qualified_name": qualified_name})
    if records and records[0].get("symbol"):
        return records[0]["symbol"]
    return None


async def get_dependents(
    client: Neo4jClient, repo_id: str, branch: str, callee_name: str, max_depth: int = 3
) -> List[Dict[str, Any]]:
    """Traverse the reverse call graph: find all callers depending on callee_name up to max_depth."""
    query = f"""
    MATCH (callee:Symbol {{repo_id: $repo_id, branch: $branch, name: $callee_name}})
    MATCH path = (caller:Symbol {{repo_id: $repo_id, branch: $branch}})-[:CALLS*1..{max_depth}]->(callee)
    RETURN DISTINCT caller.qualified_name AS qualified_name,
                    caller.name AS name,
                    caller.file_path AS file_path,
                    caller.kind AS kind,
                    length(path) AS depth
    ORDER BY depth ASC
    """
    records = await client.execute_query(query, {"repo_id": repo_id, "branch": branch, "callee_name": callee_name})
    return records


async def get_dependencies(
    client: Neo4jClient, repo_id: str, branch: str, caller_qualified_name: str, max_depth: int = 3
) -> List[Dict[str, Any]]:
    """Traverse outgoing call graph: find all functions invoked by caller_qualified_name."""
    query = f"""
    MATCH (caller:Symbol {{repo_id: $repo_id, branch: $branch, qualified_name: $caller_qualified_name}})
    MATCH path = (caller)-[:CALLS*1..{max_depth}]->(callee:Symbol {{repo_id: $repo_id, branch: $branch}})
    RETURN DISTINCT callee.qualified_name AS qualified_name,
                    callee.name AS name,
                    callee.file_path AS file_path,
                    length(path) AS depth
    ORDER BY depth ASC
    """
    records = await client.execute_query(
        query, {"repo_id": repo_id, "branch": branch, "caller_qualified_name": caller_qualified_name}
    )
    return records


async def get_all_symbols(client: Neo4jClient, repo_id: str, branch: str) -> List[Dict[str, Any]]:
    """Fetch all symbols belonging to a repo_id and branch."""
    query = """
    MATCH (s:Symbol {repo_id: $repo_id, branch: $branch})
    RETURN properties(s) AS symbol
    """
    records = await client.execute_query(query, {"repo_id": repo_id, "branch": branch})
    return [r["symbol"] for r in records if "symbol" in r]
