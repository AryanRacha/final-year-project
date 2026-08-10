from typing import Any, Dict, List, Optional
from ai_service.graph.client import Neo4jClient
from ai_service.vector.client import VectorKBClient


class UnifiedKB:
    """
    Unified Knowledge Base facade managing both structural Graph DB (Neo4j)
    and semantic Vector DB (ChromaDB).
    """

    def __init__(
        self,
        neo4j_client: Optional[Neo4jClient] = None,
        vector_client: Optional[VectorKBClient] = None,
    ):
        self.graph = neo4j_client or Neo4jClient()
        self.vector = vector_client or VectorKBClient()

    async def connect(self) -> None:
        """Connect to underlying Graph DB driver."""
        await self.graph.connect()

    async def close(self) -> None:
        """Close underlying Graph DB connections."""
        await self.graph.close()

    async def hybrid_search(
        self,
        repo_id: str,
        query_text: str,
        branch: str = "main",
        n_results: int = 5,
    ) -> Dict[str, Any]:
        """
        Perform a hybrid search:
        1. Vector similarity search over ChromaDB code/PR/commit/issue embeddings.
        2. Fuzzy symbol matching in Neo4j graph DB.
        Returns a dictionary combining both vector and graph hits.
        """
        # 1. Vector similarity search
        vector_res = self.vector.query(
            query_texts=[query_text],
            n_results=n_results,
            where={"repo": repo_id},
        )

        vector_hits = []
        if vector_res and vector_res.get("documents") and len(vector_res["documents"]) > 0 and vector_res["documents"][0]:
            docs = vector_res["documents"][0]
            metas = vector_res["metadatas"][0] if vector_res.get("metadatas") else [{}] * len(docs)
            dists = vector_res["distances"][0] if vector_res.get("distances") else [0.0] * len(docs)
            for doc, meta, dist in zip(docs, metas, dists):
                vector_hits.append({"document": doc, "metadata": meta, "distance": dist})

        # 2. Graph symbol search
        graph_query = """
        MATCH (s:Symbol {repo_id: $repo_id, branch: $branch})
        WHERE toLower(s.name) CONTAINS toLower($query_str) OR toLower(s.qualified_name) CONTAINS toLower($query_str)
        RETURN properties(s) AS symbol
        LIMIT $limit
        """
        graph_recs = await self.graph.execute_query(
            graph_query,
            {"repo_id": repo_id, "branch": branch, "query_str": query_text, "limit": n_results},
        )
        graph_hits = [r["symbol"] for r in graph_recs if "symbol" in r]

        return {
            "query": query_text,
            "repo_id": repo_id,
            "branch": branch,
            "vector_hits": vector_hits,
            "graph_hits": graph_hits,
        }
