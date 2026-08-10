import os
from enum import Enum
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.utils import embedding_functions

from ai_service.config import settings


class ContentType(str, Enum):
    CODE = "code"
    PR = "pr"
    COMMIT = "commit"
    ISSUE = "issue"


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
            self.embedding_function = embedding_functions.GoogleGenerativeAiEmbeddingFunction(
                api_key=gemini_key,
                task_type="RETRIEVAL_DOCUMENT"
            )
        else:
            # Fallback to default if no key is provided
            self.embedding_function = embedding_functions.DefaultEmbeddingFunction()

        self.collection = self.client.get_or_create_collection(
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
        commit_hash: str
    ):
        """
        Add or update a code entry in the Knowledge Base.
        """
        doc_id = f"code_{repo}_{branch}_{file_path}_{symbol}"
        document = f"Signature:\n{signature}\n\nDescription:\n{description}"
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
        Query the vector database.
        """
        return self.collection.query(
            query_texts=query_texts,
            n_results=n_results,
            where=where
        )
