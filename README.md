# RCA AI - Product Vision

## 1. Product Vision (Clear Positioning)
**Problem you are solving**
- Production incidents take too long to diagnose.
- Logs are noisy, distributed, and require expert interpretation.
- RCA depends on senior engineers’ tribal knowledge.

**Your solution**
An AI-powered RCA engine that:
- Continuously reads real-time logs from production systems
- Accepts uploaded or pasted logs (offline RCA)
- Automatically identifies: Root cause, Impacted component, Probable fix / mitigation
- Presents everything in a clear dashboard

**One-line pitch**
“An AI engine that reads your production logs and tells you what broke, why it broke, and how to fix it —in real time.”

## 2. Core Capabilities (MVP Scope)

### A. Log Ingestion (Critical)
**1. Real-Time Log Streaming**
- Agent-based or agentless
- Supports: Application logs, Server logs, Container logs (Docker/K8s)
- Protocols: HTTP, Kafka, Fluent Bit / Filebeat

**2. Offline Log Analysis**
- Upload .log, .txt, .json
- Paste logs directly into UI
- Batch processing supported

### B. Log Normalization Layer (Non-Negotiable)
**Responsibilities**
- Timestamp normalization
- Log level detection (INFO/WARN/ERROR/FATAL)
- Service/component extraction
- Correlation ID tracing
- Stack trace parsing

**Output**
Structured JSON logs.

## 3. RCA Intelligence Engine (Heart of the Product)

### A. Detection Engine (Rule + ML Hybrid)
**Layer 1: Deterministic Rules**
- Known patterns: OutOfMemoryError, DB connection pool exhausted, Timeout patterns, Circuit breaker open
- Fast, reliable, explainable

**Layer 2: ML / AI Inference**
- Sequence anomaly detection
- Error clustering
- Context-aware RCA
- Tech options: Log clustering (Drain, Spell), Anomaly detection, LLM-based reasoning

### B. Root Cause Reasoning
**Inputs**
- Error logs, Preceding events, Deployment timeline, Infra metrics

**Output**
- Root cause, Confidence score, Evidence (log lines)

### C. Solution Recommendation Engine
**Sources**
- Curated solution playbooks, Historical incident resolutions, Public KBs, Organization-specific fixes

**Output**
- Immediate mitigation, Permanent fix, Preventive actions

## 4. Dashboard & UX Design
- **Live Incident Dashboard**: Active incidents, Severity, RCA status
- **Incident Detail View**: Timeline, Root cause, Evidence, Actions
- **Offline RCA Screen**: Upload/paste logs, Get RCA

## 5. High-Level Architecture
[ Applications ] -> [ Log Agent / API ] -> [ Ingestion Service ] -> [ Normalization Pipeline ] -> [ RCA Engine (Rules + ML/LLM) ] -> [ Solution Engine ] -> [ Dashboard / API ]

## 7. Differentiators
- Explainable RCA
- Offline RCA
- Org-Specific Learning
- Action-Oriented Output
