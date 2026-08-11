import json
import pytest
from ai_service.graph.client import Neo4jClient
from ai_service.mcp.tools import (
    tool_get_repo_structure,
    tool_get_symbol_details,
    tool_get_blast_radius,
    tool_get_file_dependencies,
    tool_search_symbols,
)


@pytest.mark.asyncio
async def test_mcp_tools_against_neo4j():
    client = Neo4jClient()
    await client.connect()
    try:
        # Test repo structure
        struct_json = await tool_get_repo_structure(client, repo_id="demo-mern", branch="main")
        struct = json.loads(struct_json)
        assert struct["repo_id"] == "demo-mern"
        assert len(struct["files"]) > 0

        # Test search symbols
        search_json = await tool_search_symbols(client, repo_id="demo-mern", query_str="fetchUsers")
        results = json.loads(search_json)
        assert len(results) > 0
        assert results[0]["name"] == "fetchUsers"

        # Test blast radius
        blast_json = await tool_get_blast_radius(client, repo_id="demo-mern", changed_symbols=["tests/fixtures/mern_sample/api.js::fetchUsers"])
        blast = json.loads(blast_json)
        assert blast["risk_score"] > 0
        assert len(blast["affected_symbols"]) > 0

        # Test file dependencies
        file_deps_json = await tool_get_file_dependencies(client, repo_id="demo-mern", file_path="tests/fixtures/mern_sample/UserService.js")
        deps = json.loads(file_deps_json)
        assert "tests/fixtures/mern_sample/api.js" in deps["imports_files"]
    finally:
        await client.close()
