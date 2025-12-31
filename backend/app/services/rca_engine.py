from typing import List, Dict, Any
import re

class RCAEngine:
    def analyze_logs(self, log_content: str) -> Dict[str, Any]:
        """
        Analyze logs using heuristic patterns for MVP.
        """
        log_lower = log_content.lower()
        
        root_cause = "Unknown Anomaly"
        confidence = 0.5
        evidence = []
        solutions = []

        if "nullpointerexception" in log_lower or "cannot read property" in log_lower:
            root_cause = "Null Reference / Undefined Variable"
            confidence = 0.95
            evidence = ["Found NullPointerException/undefined in stack trace"]
            solutions = [
                "Check for null checks before accessing object properties.",
                "Verify if the object was properly initialized."
            ]
        elif "timeout" in log_lower or "timed out" in log_lower:
            root_cause = "Service/Database Timeout"
            confidence = 0.85
            evidence = ["Timeout keywords detected in logs"]
            solutions = [
                "Increase timeout configuration.",
                "Optimize database query performance.",
                "Check network connectivity."
            ]
        elif "outofmemory" in log_lower or "heap space" in log_lower:
            root_cause = "Memory Exhaustion (OOM)"
            confidence = 0.99
            evidence = ["OutOfMemoryError detected"]
            solutions = [
                "Increase heap size (-Xmx).",
                "Check for memory leaks in the application."
            ]
        elif "connection refused" in log_lower:
            root_cause = "Service Unreachable"
            confidence = 0.90
            evidence = ["Connection refused error"]
            solutions = [
                "Ensure the target service is running.",
                "Check firewall rules and port configurations."
            ]

        return {
            "root_cause": root_cause,
            "confidence": confidence,
            "evidence": evidence,
            "solutions": solutions
        }
