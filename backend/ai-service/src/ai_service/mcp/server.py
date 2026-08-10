from contextlib import asynccontextmanager
from typing import List, Optional
from fastmcp import FastMCP
from ai_service.graph.client import Neo4jClient
from ai_service.mcp.tools import (
    tool_get_repo_structure,
    tool_get_symbol_details,
    tool_get_blast_radius,
    tool_get_file_dependencies,
    tool_search_symbols,
)


@asynccontextmanager
async def app_lifespan(server: FastMCP):
    """FastMCP lifespan context manager for Neo4j async client connection."""
    client = Neo4jClient()
    await client.connect()
    try:
        yield {"client": client}
    finally:
        await client.close()


mcp_server = FastMCP("CodeReview-KB", lifespan=app_lifespan)


@mcp_server.tool()
async def get_repo_structure(repo_id: str, branch: str = "main") -> str:
    """Retrieve the full file tree and symbol hierarchy for a repository in the Knowledge Base."""
    client = Neo4jClient()
    await client.connect()
    try:
        return await tool_get_repo_structure(client, repo_id=repo_id, branch=branch)
    finally:
        await client.close()


@mcp_server.tool()
async def get_symbol_details(repo_id: str, qualified_name: str, branch: str = "main") -> str:
    """Get detailed symbol metadata, docstrings, incoming callers, and outgoing callees."""
    client = Neo4jClient()
    await client.connect()
    try:
        return await tool_get_symbol_details(client, repo_id=repo_id, qualified_name=qualified_name, branch=branch)
    finally:
        await client.close()


@mcp_server.tool()
async def get_blast_radius(repo_id: str, changed_symbols: List[str], branch: str = "main") -> str:
    """Analyze blast radius and downstream symbol impact for a set of changed symbol qualified names."""
    client = Neo4jClient()
    await client.connect()
    try:
        return await tool_get_blast_radius(client, repo_id=repo_id, changed_symbols=changed_symbols, branch=branch)
    finally:
        await client.close()


@mcp_server.tool()
async def get_file_dependencies(repo_id: str, file_path: str, branch: str = "main") -> str:
    """Get inbound importer files, outbound imported files, and external package dependencies for a file."""
    client = Neo4jClient()
    await client.connect()
    try:
        return await tool_get_file_dependencies(client, repo_id=repo_id, file_path=file_path, branch=branch)
    finally:
        await client.close()


@mcp_server.tool()
async def search_symbols(repo_id: str, query: str, branch: str = "main") -> str:
    """Fuzzy search for symbols matching a search query string across the knowledge graph."""
    client = Neo4jClient()
    await client.connect()
    try:
        return await tool_search_symbols(client, repo_id=repo_id, query_str=query, branch=branch)
    finally:
        await client.close()


def run_mcp_server():
    """Run FastMCP server using stdio transport."""
    mcp_server.run(transport="stdio")


if __name__ == "__main__":
    run_mcp_server()
