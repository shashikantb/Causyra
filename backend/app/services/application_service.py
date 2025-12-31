from typing import List, Dict, Optional
from datetime import datetime
from uuid import uuid4
import json
import os
from ..models.application import Application, ApplicationCreate, Incident, LogSource, LogSourceCreate

class ApplicationService:
    def __init__(self):
        # In-memory storage for MVP, persisted to a JSON file
        self.applications: Dict[str, Application] = {}
        self.incidents: Dict[str, List[Incident]] = {}
        self.recent_logs: Dict[str, List[dict]] = {}
        self.recent_logs_by_source: Dict[str, Dict[str, List[dict]]] = {}
        self.last_seen: Dict[str, datetime] = {}
        base_dir = os.path.dirname(__file__)
        app_dir = os.path.abspath(os.path.join(base_dir, ".."))
        self.data_file = os.path.join(app_dir, "data.json")
        self._load_state()

    def create_application(self, app_create: ApplicationCreate) -> Application:
        app_id = str(uuid4())
        new_app = Application(
            id=app_id,
            name=app_create.name,
            type=app_create.type,
            created_at=datetime.now(),
            log_sources=[]
        )
        self.applications[app_id] = new_app
        self.incidents[app_id] = [] # Initialize incident list
        self._save_state()
        return new_app

    def get_applications(self) -> List[Application]:
        return list(self.applications.values())

    def get_application(self, app_id: str) -> Optional[Application]:
        return self.applications.get(app_id)

    def ensure_application(self, app_id: str, name: Optional[str] = None, type_: Optional[str] = None) -> Application:
        existing = self.applications.get(app_id)
        if existing:
            return existing
        new_app = Application(
            id=app_id,
            name=name or f"Agent {app_id[:6]}",
            type=type_ or "Unknown",
            created_at=datetime.now(),
            log_sources=[]
        )
        self.applications[app_id] = new_app
        self.incidents[app_id] = []
        self._save_state()
        return new_app

    def add_log_source(self, app_id: str, source_create: LogSourceCreate) -> Optional[LogSource]:
        app = self.applications.get(app_id)
        if not app:
            return None
        for existing in app.log_sources:
            if existing.path == source_create.path:
                return existing
        new_source = LogSource(
            id=str(uuid4()),
            path=source_create.path,
            type=source_create.type,
            status="active"
        )
        app.log_sources.append(new_source)
        self._save_state()
        return new_source

    def delete_log_source(self, app_id: str, source_id: str) -> bool:
        app = self.applications.get(app_id)
        if not app:
            return False
        before = len(app.log_sources)
        app.log_sources = [ls for ls in app.log_sources if ls.id != source_id]
        if len(app.log_sources) != before:
            self._save_state()
            return True
        return False

    def delete_application(self, app_id: str) -> bool:
        removed = False
        if app_id in self.applications:
            del self.applications[app_id]
            removed = True
        if app_id in self.incidents:
            del self.incidents[app_id]
        if app_id in self.recent_logs:
            del self.recent_logs[app_id]
        if app_id in self.recent_logs_by_source:
            del self.recent_logs_by_source[app_id]
        if app_id in self.last_seen:
            del self.last_seen[app_id]
        if removed:
            self._save_state()
        return removed

    def get_log_sources(self, app_id: str) -> List[LogSource]:
        app = self.applications.get(app_id)
        if not app:
            return []
        return app.log_sources

    def get_incidents(self, app_id: str) -> List[Incident]:
        return self.incidents.get(app_id, [])

    def get_incidents_by_tag(self, app_id: str, tag: Optional[str]) -> List[Incident]:
        all_inc = self.incidents.get(app_id, [])
        if tag is None:
            return all_inc
        if tag == "UNTAGGED":
            return [i for i in all_inc if not i.tag]
        return [i for i in all_inc if i.tag == tag]

    # Helper to simulate an incident for demo purposes
    def create_mock_incident(self, app_id: str, title: str, severity: str):
        return self.create_incident(
            app_id=app_id,
            title=title,
            severity=severity,
            root_cause="Simulated High Latency / Timeout",
            log_path=None,
            log_line=None,
            solutions=["Optimize database queries", "Increase connection timeout", "Check load balancer settings"]
        )

    def create_incident(self, app_id: str, title: str, severity: str, root_cause: Optional[str] = None, log_path: Optional[str] = None, log_line: Optional[str] = None, solutions: List[str] = []):
        if app_id not in self.incidents:
            return None
        
        # Normalize log_path
        normalized_path = log_path.strip() if log_path else None
        
        now = datetime.now()
        
        # Try to find existing incident to aggregate
        for inc in self.incidents[app_id]:
            # Check for root_cause match
            same_root = inc.root_cause == root_cause
            
            if same_root:
                # Check log path compatibility
                inc_path = inc.log_path.strip() if inc.log_path else None
                
                # Logic:
                # 1. If paths are identical -> Merge
                # 2. If existing is None/Unknown and new is specific -> Merge (and update path)
                # 3. If existing is specific and new is None/Unknown -> Merge (keep specific)
                # 4. If both specific but different -> Keep separate
                
                should_merge = False
                update_path = False
                
                if inc_path == normalized_path:
                    should_merge = True
                elif not inc_path and normalized_path:
                    should_merge = True
                    update_path = True
                elif inc_path and not normalized_path:
                    should_merge = True
                
                if should_merge:
                    inc.occurrences = (inc.occurrences or 1) + 1
                    inc.last_seen = now
                    # Update log line to latest
                    if log_line:
                        inc.log_line = log_line
                    inc.severity = severity
                    if update_path:
                        inc.log_path = normalized_path
                    self._save_state()
                    return inc

        incident = Incident(
            id=str(uuid4()),
            app_id=app_id,
            title=title,
            severity=severity,
            status="DETECTED",
            timestamp=now,
            root_cause=root_cause,
            log_path=normalized_path,
            log_line=log_line,
            solutions=solutions,
            occurrences=1,
            first_seen=now,
            last_seen=now
        )
        self.incidents[app_id].append(incident)
        self._save_state()
        return incident

    def cleanup_duplicates(self, app_id: str):
        """
        Merges duplicate incidents that might have been created due to race conditions or legacy bugs.
        Handles merging Mock incidents (no path) into Real incidents (with path).
        """
        if app_id not in self.incidents:
            return
            
        # print(f"[DEBUG] Cleaning duplicates for {app_id}. Total: {len(self.incidents[app_id])}")
        cleaned_list = []
        merged_indices = set()
        
        # Sort by timestamp to keep the oldest as the 'original'
        sorted_incidents = sorted(self.incidents[app_id], key=lambda x: x.timestamp)
        
        for i in range(len(sorted_incidents)):
            if i in merged_indices:
                continue
                
            base = sorted_incidents[i]
            base_path = base.log_path.strip() if base.log_path else None
            
            # Look ahead for duplicates
            for j in range(i + 1, len(sorted_incidents)):
                if j in merged_indices:
                    continue
                    
                candidate = sorted_incidents[j]
                cand_path = candidate.log_path.strip() if candidate.log_path else None
                
                if base.root_cause == candidate.root_cause:
                    # Check path compatibility
                    should_merge = False
                    update_base_path = False
                    
                    if base_path == cand_path:
                        should_merge = True
                    elif not base_path and cand_path:
                        # Merge mock/unknown into specific, update base to be specific
                        should_merge = True
                        update_base_path = True
                    elif base_path and not cand_path:
                        should_merge = True
                        
                    if should_merge:
                        # Merge candidate into base
                        base.occurrences = (base.occurrences or 1) + (candidate.occurrences or 1)
                        base.last_seen = max(base.last_seen or base.timestamp, candidate.last_seen or candidate.timestamp)
                        # Keep the latest log line
                        if candidate.timestamp > base.timestamp and candidate.log_line:
                            base.log_line = candidate.log_line
                        
                        if update_base_path:
                            base.log_path = cand_path
                            base_path = cand_path # Update local var for subsequent checks
                            
                        merged_indices.add(j)
            
            cleaned_list.append(base)
        
        # print(f"[DEBUG] Cleaned list size: {len(cleaned_list)}")
        if len(cleaned_list) < len(self.incidents[app_id]):
            # print(f"[DEBUG] Saving cleanup. Removed {len(self.incidents[app_id]) - len(cleaned_list)} duplicates.")
             self.incidents[app_id] = cleaned_list
             self._save_state()

    def add_log_entry(self, app_id: str, content: str, source: str):
        if app_id not in self.recent_logs:
            self.recent_logs[app_id] = []
        if app_id not in self.recent_logs_by_source:
            self.recent_logs_by_source[app_id] = {}
        if source not in self.recent_logs_by_source[app_id]:
            self.recent_logs_by_source[app_id][source] = []

        entry = {
            "timestamp": datetime.now().isoformat(),
            "content": content.strip(),
            "source": source
        }
        self.recent_logs[app_id].insert(0, entry)
        if len(self.recent_logs[app_id]) > 200:
            self.recent_logs[app_id] = self.recent_logs[app_id][:200]

        self.recent_logs_by_source[app_id][source].insert(0, entry)
        if len(self.recent_logs_by_source[app_id][source]) > 50:
            self.recent_logs_by_source[app_id][source] = self.recent_logs_by_source[app_id][source][:50]
        
        self._save_state()

    def get_recent_logs(self, app_id: str) -> List[dict]:
        return self.recent_logs.get(app_id, [])

    def get_recent_logs_by_source(self, app_id: str) -> Dict[str, List[dict]]:
        return self.recent_logs_by_source.get(app_id, {})

    def update_last_seen(self, app_id: str):
        self.last_seen[app_id] = datetime.now()

    def get_summary(self, app_id: str) -> Dict[str, object]:
        sources = self.recent_logs_by_source.get(app_id, {})
        counts = {src: len(entries) for src, entries in sources.items()}
        seen = self.last_seen.get(app_id)
        return {
            "counts": counts,
            "last_seen": seen.isoformat() if seen else None
        }

    def set_incident_tag(self, app_id: str, incident_id: str, tag: Optional[str]) -> bool:
        inc_list = self.incidents.get(app_id, [])
        for inc in inc_list:
            if inc.id == incident_id:
                inc.tag = tag
                self._save_state()
                return True
        return False

    def _load_state(self):
        if not os.path.exists(self.data_file):
            return
        try:
            with open(self.data_file, "r") as f:
                data = json.load(f)
            # Load applications
            apps_data = data.get("applications", {})
            for app_id, app_dict in apps_data.items():
                # Parse datetime
                app_dict["created_at"] = datetime.fromisoformat(app_dict["created_at"])
                # Convert log_sources to models
                ls_list = [LogSource(**ls) for ls in app_dict.get("log_sources", [])]
                seen_paths = set()
                deduped = []
                for ls in ls_list:
                    if ls.path in seen_paths:
                        continue
                    seen_paths.add(ls.path)
                    deduped.append(ls)
                app_dict["log_sources"] = deduped
                self.applications[app_id] = Application(**app_dict)
            # Load incidents
            inc_data = data.get("incidents", {})
            for app_id, inc_list in inc_data.items():
                self.incidents[app_id] = []
                for inc in inc_list:
                    inc["timestamp"] = datetime.fromisoformat(inc["timestamp"])
                    if inc.get("first_seen"):
                        inc["first_seen"] = datetime.fromisoformat(inc["first_seen"])
                    if inc.get("last_seen"):
                        inc["last_seen"] = datetime.fromisoformat(inc["last_seen"])
                    self.incidents[app_id].append(Incident(**inc))
            # Load logs
            self.recent_logs = data.get("recent_logs", {})
            self.recent_logs_by_source = data.get("recent_logs_by_source", {})
            
            # Clean up duplicates for all apps after loading
            for app_id in list(self.incidents.keys()):
                self.cleanup_duplicates(app_id)

        except Exception:
            # If load fails, start fresh
            self.applications = {}
            self.incidents = {}
            self.recent_logs = {}
            self.recent_logs_by_source = {}

    def _save_state(self):
        try:
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            data = {
                "applications": {},
                "incidents": {},
                "recent_logs": self.recent_logs,
                "recent_logs_by_source": self.recent_logs_by_source
            }
            for app_id, app in self.applications.items():
                app_dict = app.model_dump()
                app_dict["created_at"] = app.created_at.isoformat()
                app_dict["log_sources"] = [ls.model_dump() for ls in app.log_sources]
                data["applications"][app_id] = app_dict
            for app_id, inc_list in self.incidents.items():
                data["incidents"][app_id] = []
                for inc in inc_list:
                    inc_dict = inc.model_dump()
                    inc_dict["timestamp"] = inc.timestamp.isoformat()
                    data["incidents"][app_id].append(inc_dict)
            with open(self.data_file, "w") as f:
                json.dump(data, f)
        except Exception:
            # Silently fail for MVP
            pass
