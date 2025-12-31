from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from .models.application import Application, ApplicationCreate, Incident, LogSource, LogSourceCreate
from .services.application_service import ApplicationService
from .services.rca_engine import RCAEngine

app = FastAPI(
    title="RCA AI Engine",
    description="AI-powered Root Cause Analysis Engine",
    version="0.1.0"
)

# Mount static files for agent script
app.mount("/static", StaticFiles(directory="backend/app/static"), name="static")

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
app_service = ApplicationService()
rca_engine = RCAEngine()

@app.get("/")
async def root():
    return {"message": "RCA AI Engine is running", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Application Endpoints
@app.post("/applications", response_model=Application)
async def create_application(app_create: ApplicationCreate):
    return app_service.create_application(app_create)

@app.get("/applications", response_model=List[Application])
async def list_applications():
    return app_service.get_applications()

@app.delete("/applications/{app_id}")
async def delete_application(app_id: str):
    ok = app_service.delete_application(app_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"status": "deleted"}

@app.get("/applications/{app_id}/incidents", response_model=List[Incident])
async def get_app_incidents(app_id: str, tag: Optional[str] = None):
    # For demo purposes, if no incidents exist, create a mock one so the user sees something
    incidents = app_service.get_incidents_by_tag(app_id, tag)
    if not incidents:
        app_service.create_mock_incident(app_id, "High Latency Detected", "MEDIUM")
        incidents = app_service.get_incidents_by_tag(app_id, tag)
    return incidents

@app.post("/applications/{app_id}/logs", response_model=LogSource)
async def add_log_source(app_id: str, source: LogSourceCreate):
    result = app_service.add_log_source(app_id, source)
    if not result:
        raise HTTPException(status_code=404, detail="Application not found")
    return result

@app.get("/applications/{app_id}/logs", response_model=List[LogSource])
async def list_log_sources(app_id: str):
    sources = app_service.get_log_sources(app_id)
    if sources is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return sources

@app.delete("/applications/{app_id}/logs/{source_id}")
async def delete_log_source(app_id: str, source_id: str):
    ok = app_service.delete_log_source(app_id, source_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Log source not found")
    return {"status": "deleted"}

@app.get("/applications/{app_id}/logs/recent_by_source")
async def get_recent_logs_by_source(app_id: str):
    if not app_service.get_application(app_id):
        raise HTTPException(status_code=404, detail="Application not found")
    return app_service.get_recent_logs_by_source(app_id)

@app.get("/applications/{app_id}/logs/summary")
async def get_log_summary(app_id: str):
    if not app_service.get_application(app_id):
        raise HTTPException(status_code=404, detail="Application not found")
    return app_service.get_summary(app_id)

@app.get("/applications/{app_id}/logs/recent")
async def get_recent_logs(app_id: str):
    if not app_service.get_application(app_id):
        raise HTTPException(status_code=404, detail="Application not found")
    return app_service.get_recent_logs(app_id)

# RCA Endpoints
@app.post("/rca/analyze")
async def analyze_logs(log_content: str = Body(..., embed=True)):
    return rca_engine.analyze_logs(log_content)

# Agent Endpoints
@app.post("/agents/{app_id}/heartbeat")
async def agent_heartbeat(app_id: str):
    app_service.ensure_application(app_id)
    app_service.update_last_seen(app_id)
    return {"status": "ok"}

@app.post("/agents/{app_id}/ingest")
async def agent_ingest(app_id: str, payload: dict):
    """
    payload: { "path": "...", "content": "..." }
    """
    app_service.ensure_application(app_id)
    content = payload.get("content", "")
    path = payload.get("path", "unknown")
    if not content:
        return {"status": "ignored", "reason": "empty content"}
    app_service.update_last_seen(app_id)
    lines = [l for l in content.splitlines() if l.strip()]
    incidents_created = 0
    
    # Run cleanup first to ensure we don't build on top of duplicates
    app_service.cleanup_duplicates(app_id)
    
    for line in lines:
        app_service.add_log_entry(app_id, line, path)
        analysis = rca_engine.analyze_logs(line)
        root = analysis.get("root_cause", "Unknown Anomaly")
        if root != "Unknown Anomaly":
            severity = "HIGH" if analysis.get("confidence", 0.0) >= 0.9 else "MEDIUM"
            solutions = analysis.get("solutions", [])
            app_service.create_incident(
                app_id, 
                title=root, 
                severity=severity, 
                root_cause=root,
                log_path=path,
                log_line=line,
                solutions=solutions
            )
            incidents_created += 1
    return {"status": "processed", "lines_ingested": len(lines), "incidents_created": incidents_created}

@app.post("/applications/{app_id}/incidents/{incident_id}/tag")
async def set_incident_tag(app_id: str, incident_id: str, body: dict):
    if not app_service.get_application(app_id):
        raise HTTPException(status_code=404, detail="Application not found")
    tag = body.get("tag")
    ok = app_service.set_incident_tag(app_id, incident_id, tag)
    if not ok:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"status": "ok", "tag": tag}
