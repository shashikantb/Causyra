from typing import List, Dict, Any
from enum import Enum
from pydantic import BaseModel

class LogSource(Enum):
    API = "api"
    FILE = "file"
    STREAM = "stream"

class LogEntry(BaseModel):
    raw_content: str
    source: LogSource
    metadata: Dict[str, Any] = {}

class IngestionService:
    async def ingest_log(self, entry: LogEntry) -> Dict[str, Any]:
        """
        Ingest a single log entry.
        """
        # TODO: Implement actual ingestion logic (buffer, queue, etc.)
        return {"status": "received", "length": len(entry.raw_content)}

    async def ingest_batch(self, entries: List[LogEntry]) -> Dict[str, Any]:
        """
        Ingest a batch of log entries.
        """
        results = []
        for entry in entries:
            results.append(await self.ingest_log(entry))
        return {"processed": len(results), "details": results}
