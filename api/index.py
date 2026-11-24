"""Vercel entry point: serves the Flask prediction API from ml/api.py under /api/*."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "ml"))            # so ml/api.py can import combine.py

spec = importlib.util.spec_from_file_location("prediction_api", ROOT / "ml" / "api.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

app = module.app                                  # the WSGI app that Vercel looks for
