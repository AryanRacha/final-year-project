from typing import Any, Dict, List, Optional
from neo4j import AsyncGraphDatabase, AsyncDriver
from ai_service.config import settings


class Neo4jClient:
    """Async Neo4j database client wrapper."""

    def __init__(
        self,
        uri: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
    ):
        self.uri = uri or settings.neo4j_uri
        self.user = user or settings.neo4j_user
        self.password = password or settings.neo4j_password
        self.database = database or settings.neo4j_database
        self._driver: Optional[AsyncDriver] = None

    async def connect(self) -> None:
        if not self._driver:
            self._driver = AsyncGraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password),
            )

    async def close(self) -> None:
        if self._driver:
            await self._driver.close()
            self._driver = None

    async def verify_connectivity(self) -> bool:
        if not self._driver:
            await self.connect()
        assert self._driver is not None
        await self._driver.verify_connectivity()
        return True

    async def execute_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Run a query asynchronously and return matching record dictionaries."""
        if not self._driver:
            await self.connect()
        assert self._driver is not None

        records, summary, keys = await self._driver.execute_query(
            query,
            parameters_=(parameters or {}),
            database_=self.database,
        )
        return [record.data() for record in records]
