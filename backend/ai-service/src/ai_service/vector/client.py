import os
import time
from enum import Enum
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.utils import embedding_functions
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings

from ai_service.config import settings


class ContentType(str, Enum):
    CODE = "code"
    PR = "pr"
    COMMIT = "commit"
    ISSUE = "issue"


class GeminiEmbeddingFunction(EmbeddingFunction):
    """ChromaDB EmbeddingFunction using Google's official google-genai SDK with rate limit handling."""

    def __init__(self, api_key: str, model_name: str = "models/gemini-embedding-001"):
        from google import genai
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name

    def name(self) -> str:
        return "gemini_embedding_function"

    def get_config(self) -> Dict[str, Any]:
        return {"model_name": self.model_name}

    def __call__(self, input: Documents) -> Embeddings:
        if not input:
            return []

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.models.embed_content(
                    model=self.model_name,
                    contents=list(input),
                )
                return [emb.values for emb in response.embeddings]
            except Exception as e:
                err_str = str(e)
                if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str) and attempt < max_retries - 1:
                    time.sleep(4 * (attempt + 1))
                    continue

                embeddings = []
                for doc in input:
                    try:
                        res = self.client.models.embed_content(
                            model=self.model_name,
                            contents=doc,
                        )
                        embeddings.append(res.embeddings[0].values)
                    except Exception:
                        embeddings.append([0.0] * 3072)
                return embeddings

        return [[0.0] * 3072 for _ in input]


class VectorKBClient:
    def __init__(self, persist_directory: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize the ChromaDB client with Gemini embeddings.
        :param persist_directory: Directory to persist the ChromaDB data.
        :param api_key: Gemini API key. If not provided, it will try env vars then config settings.
        """
        path = persist_directory or settings.chroma_persist_dir
        self.client = chromadb.PersistentClient(path=path)

        gemini_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or settings.gemini_api_key
        if gemini_key:
            try:
                self.embedding_function = GeminiEmbeddingFunction(api_key=gemini_key)
            except Exception:
                self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
        else:
            # Fallback to default if no key is provided
            self.embedding_function = embedding_functions.DefaultEmbeddingFunction()

        try:
            self.collection = self.client.get_or_create_collection(
                name="knowledge_base",
                embedding_function=self.embedding_function
            )
        except ValueError:
            # If collection exists on disk with a conflicting embedding function (e.g. default), recreate it
            try:
                self.client.delete_collection(name="knowledge_base")
            except Exception:
                pass
            self.collection = self.client.create_collection(
                name="knowledge_base",
                embedding_function=self.embedding_function
            )

    def _upsert(self, doc_id: str, document: str, metadata: Dict[str, Any]):
        """Helper to upsert a document with its metadata."""
        self.collection.upsert(
            ids=[doc_id],
            documents=[document],
            metadatas=[metadata]
        )

    def add_code_entry(
        self,
        repo: str,
        branch: str,
        file_path: str,
        symbol: str,
        signature: str,
        description: str,
        commit_hash: str,
        start_line: Optional[int] = None,
        code_body: str = "",
    ):
        """
        Add or update a code entry in the Knowledge Base.
        """
        line_suffix = f"_{start_line}" if start_line is not None else ""
        doc_id = f"code_{repo}_{branch}_{file_path}_{symbol}{line_suffix}"
        
        doc_parts = [
            f"File: {file_path}" + (f" (lines {start_line})" if start_line else ""),
            f"Symbol: {symbol}",
            f"Signature:\n{signature}",
            f"Description:\n{description}",
        ]
        if code_body:
            doc_parts.append(f"Implementation Code:\n{code_body}")
        document = "\n\n".join(doc_parts)

        metadata = {
            "repo": repo,
            "branch": branch,
            "file_path": file_path,
            "symbol": symbol,
            "content_type": ContentType.CODE.value,
            "commit_hash": commit_hash,
            "last_valid_commit": commit_hash
        }
        self._upsert(doc_id, document, metadata)

    def add_code_entries_batch(self, entries: List[Dict[str, Any]]):
        """
        Batch upsert multiple code entries into ChromaDB at once to reduce embedding API calls.
        Deduplicates keys by unique doc_id to avoid ChromaDB batch conflicts.
        """
        if not entries:
            return

        unique_map = {}
        for item in entries:
            start_line = item.get("start_line")
            line_suffix = f"_{start_line}" if start_line is not None else ""
            doc_id = f"code_{item['repo']}_{item['branch']}_{item['file_path']}_{item['symbol']}{line_suffix}"
            
            doc_parts = [
                f"File: {item['file_path']}" + (f" (lines {start_line})" if start_line else ""),
                f"Symbol: {item['symbol']}",
                f"Signature:\n{item['signature']}",
                f"Description:\n{item['description']}",
            ]
            if item.get("code_body"):
                doc_parts.append(f"Implementation Code:\n{item['code_body']}")
            document = "\n\n".join(doc_parts)

            metadata = {
                "repo": item["repo"],
                "branch": item["branch"],
                "file_path": item["file_path"],
                "symbol": item["symbol"],
                "content_type": ContentType.CODE.value,
                "commit_hash": item["commit_hash"],
                "last_valid_commit": item["commit_hash"]
            }
            unique_map[doc_id] = (document, metadata)

        doc_ids = list(unique_map.keys())
        docs = [v[0] for v in unique_map.values()]
        metas = [v[1] for v in unique_map.values()]

        batch_size = 40
        for i in range(0, len(doc_ids), batch_size):
            self.collection.upsert(
                ids=doc_ids[i:i + batch_size],
                documents=docs[i:i + batch_size],
                metadatas=metas[i:i + batch_size]
            )

    def add_pr_entry(
        self,
        repo: str,
        branch: str,
        pr_id: str,
        description_text: str,
        commit_hash: str
    ):
        """
        Add or update a Pull Request entry.
        """
        doc_id = f"pr_{repo}_{branch}_{pr_id}"
        metadata = {
            "repo": repo,
            "branch": branch,
            "pr_id": pr_id,
            "content_type": ContentType.PR.value,
            "commit_hash": commit_hash,
            "last_valid_commit": commit_hash
        }
        self._upsert(doc_id, description_text, metadata)

    def add_commit_entry(
        self,
        repo: str,
        branch: str,
        commit_hash: str,
        commit_message: str
    ):
        """
        Add a commit message entry.
        """
        doc_id = f"commit_{repo}_{branch}_{commit_hash}"
        metadata = {
            "repo": repo,
            "branch": branch,
            "content_type": ContentType.COMMIT.value,
            "commit_hash": commit_hash,
            "last_valid_commit": commit_hash
        }
        self._upsert(doc_id, commit_message, metadata)

    def add_issue_entry(
        self,
        repo: str,
        issue_id: str,
        issue_text: str
    ):
        """
        Add or update an Issue entry.
        """
        doc_id = f"issue_{repo}_{issue_id}"
        metadata = {
            "repo": repo,
            "issue_id": issue_id,
            "content_type": ContentType.ISSUE.value
        }
        self._upsert(doc_id, issue_text, metadata)

    def roll_forward_commit(self, repo: str, branch: str, old_commit_hash: str, new_commit_hash: str):
        """
        Update the 'last_valid_commit' and 'commit_hash' of all entries for a given repo and branch 
        from old_commit_hash to new_commit_hash.
        """
        results = self.collection.get(
            where={
                "$and": [
                    {"repo": repo},
                    {"branch": branch},
                    {"last_valid_commit": old_commit_hash}
                ]
            },
            include=["metadatas"]
        )

        if not results or not results["ids"]:
            return

        ids_to_update = results["ids"]
        metadatas_to_update = results["metadatas"]

        for meta in metadatas_to_update:
            meta["last_valid_commit"] = new_commit_hash
            meta["commit_hash"] = new_commit_hash

        self.collection.update(
            ids=ids_to_update,
            metadatas=metadatas_to_update
        )

    def delete_stale_entries(self, repo: str, branch: str, latest_commit_hash: str):
        """
        Delete entries for a given repo and branch that do not have the latest_commit_hash.
        """
        self.collection.delete(
            where={
                "$and": [
                    {"repo": repo},
                    {"branch": branch},
                    {"last_valid_commit": {"$ne": latest_commit_hash}}
                ]
            }
        )

    def query(
        self,
        query_texts: List[str],
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Query the vector database with fallback filtering if target repo filter yields no hits.
        """
        res = self.collection.query(
            query_texts=query_texts,
            n_results=n_results,
            where=where
        )
        if where and res and res.get("documents") and len(res["documents"]) > 0:
            if not res["documents"][0]:
                res = self.collection.query(
                    query_texts=query_texts,
                    n_results=n_results,
                )
        return res

