from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    WRITE = "WRITE"
    READ = "READ"

class LogSource(BaseModel):
    id: str
    path: str
    type: str # e.g., "file", "stream"
    status: str # "active", "pending"

class Application(BaseModel):
    id: str
    name: str
    type: str  # e.g., "Java", "Node.js", "Python", "K8s"
    created_at: datetime
    log_sources: List[LogSource] = []

class ApplicationCreate(BaseModel):
    name: str
    type: str

class LogSourceCreate(BaseModel):
    path: str
    type: str = "file"

class Incident(BaseModel):
    id: str
    app_id: str
    title: str
    severity: str  # HIGH, MEDIUM, LOW
    status: str    # DETECTED, ANALYZING, IDENTIFIED, RESOLVED
    timestamp: datetime
    root_cause: Optional[str] = None
    log_path: Optional[str] = None
    log_line: Optional[str] = None
    solutions: List[str] = []
    occurrences: int = 1
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    tag: Optional[str] = None
