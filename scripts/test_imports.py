import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

try:
    from backend.app.main import app
    from backend.app.services.ingestion import IngestionService
    from backend.app.services.normalization import NormalizationService
    from backend.app.services.rca_engine import RCAEngine
    from backend.app.services.solution_engine import SolutionEngine
    print("Backend imports successful")
except ImportError as e:
    print(f"ImportError: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
