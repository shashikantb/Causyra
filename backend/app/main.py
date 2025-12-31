from fastapi import FastAPI, HTTPException, Body, Depends, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from datetime import timedelta

from .models.application import Application, ApplicationCreate, Incident, LogSource, LogSourceCreate
from .services.application_service import ApplicationService
from .services.rca_engine import RCAEngine
from .auth import Token, authenticate_user, create_access_token, get_current_active_user, get_current_admin_user, ACCESS_TOKEN_EXPIRE_MINUTES, user_service
from .models.user import User, UserCreate, PasswordChange, UserScopeUpdate

app = FastAPI(
    title="RCA AI Engine",
    description="AI-powered Root Cause Analysis Engine",
    version="0.1.0"
)

# Mount static files for agent script
app.mount("/static", StaticFiles(directory="app/static"), name="static")

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

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.post("/users", response_model=User)
async def create_user(user: UserCreate, current_user: User = Depends(get_current_admin_user)):
    db_user = user_service.create_user(user)
    if not db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return db_user

@app.get("/users", response_model=List[User])
async def read_users(current_user: User = Depends(get_current_admin_user)):
    return user_service.get_users()

@app.put("/users/me/password")
async def change_own_password(password_change: PasswordChange, current_user: User = Depends(get_current_active_user)):
    # Verify old password
    user_in_db = user_service.get_user(current_user.username)
    if not user_service.verify_password(password_change.old_password, user_in_db.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    user_service.update_password(current_user.username, password_change.new_password)
    return {"status": "password updated"}

@app.put("/users/{username}/password")
async def change_user_password(username: str, password_change: PasswordChange, current_user: User = Depends(get_current_admin_user)):
    success = user_service.update_password(username, password_change.new_password)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "password updated"}

@app.put("/users/{username}/scope")
async def update_user_scope(username: str, scope_update: UserScopeUpdate, current_user: User = Depends(get_current_admin_user)):
    success = user_service.update_user_scope(username, scope_update.allowed_apps)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "scope updated"}

@app.get("/")
async def root():
    return {"message": "RCA AI Engine is running", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Application Endpoints
@app.post("/applications", response_model=Application)
async def create_application(app_create: ApplicationCreate, current_user: User = Depends(get_current_active_user)):
    if current_user.role == "READ":
         raise HTTPException(status_code=403, detail="Not authorized to create applications")
    
    new_app = app_service.create_application(app_create)
    
    # If not admin, add to allowed apps
    if current_user.role != "ADMIN":
        # Make sure allowed_apps is initialized
        if current_user.allowed_apps is None:
            current_user.allowed_apps = []
        current_user.allowed_apps.append(new_app.id)
        user_service.update_user_scope(current_user.username, current_user.allowed_apps)
        
    return new_app

@app.get("/applications", response_model=List[Application])
async def list_applications(current_user: User = Depends(get_current_active_user)):
    all_apps = app_service.get_applications()
    if current_user.role == "ADMIN":
        return all_apps
    
    # Filter for non-admin users
    # Ensure allowed_apps is not None
    allowed = current_user.allowed_apps or []
    return [app for app in all_apps if app.id in allowed]

@app.delete("/applications/{app_id}")
async def delete_application(app_id: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role == "READ":
        raise HTTPException(status_code=403, detail="Not authorized to delete applications")
    
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
async def add_log_source(app_id: str, source: LogSourceCreate, current_user: User = Depends(get_current_active_user)):
    if current_user.role == "READ":
        raise HTTPException(status_code=403, detail="Not authorized to add log sources")
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
async def delete_log_source(app_id: str, source_id: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role == "READ":
        raise HTTPException(status_code=403, detail="Not authorized to delete log sources")
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
async def set_incident_tag(app_id: str, incident_id: str, body: dict, current_user: User = Depends(get_current_active_user)):
    if current_user.role == "READ":
        raise HTTPException(status_code=403, detail="Not authorized to tag incidents")
    if not app_service.get_application(app_id):
        raise HTTPException(status_code=404, detail="Application not found")
    tag = body.get("tag")
    ok = app_service.set_incident_tag(app_id, incident_id, tag)
    if not ok:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"status": "ok", "tag": tag}
