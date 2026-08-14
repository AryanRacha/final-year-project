import json
import pytest
from pathlib import Path
from ai_service.graph.client import Neo4jClient
from ai_service.jobs.init_job import run_init_job
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
        # Check if demo-mern is seeded, otherwise seed it from fixture
        struct_json = await tool_get_repo_structure(client, repo_id="demo-mern", branch="main")
        struct = json.loads(struct_json)
        if len(struct.get("files", [])) == 0:
            fixture_dir = Path(__file__).parent.parent / "fixtures" / "mern_sample"
            if fixture_dir.exists():
                await run_init_job(
                    repo_id="demo-mern",
                    branch="main",
                    repo_dir=fixture_dir,
                    client=client,
                )
                struct_json = await tool_get_repo_structure(client, repo_id="demo-mern", branch="main")
                struct = json.loads(struct_json)

        assert struct["repo_id"] == "demo-mern"

        # Test search symbols
        search_json = await tool_search_symbols(client, repo_id="demo-mern", query_str="fetchUsers")
        results = json.loads(search_json)
        assert isinstance(results, list)

        # Test blast radius
        blast_json = await tool_get_blast_radius(client, repo_id="demo-mern", changed_symbols=["tests/fixtures/mern_sample/api.js::fetchUsers"])
        blast = json.loads(blast_json)
        assert "risk_score" in blast

        # Test file dependencies
        file_deps_json = await tool_get_file_dependencies(client, repo_id="demo-mern", file_path="UserService.js")
        deps = json.loads(file_deps_json)
        assert "file_path" in deps
        assert "imported_by_files" in deps
    finally:
        await client.close()
