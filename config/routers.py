# config/routers.py
import importlib
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class RouterManager:
    """
    Detects and imports FastAPI routers from apps/*/routers.py
    and includes them into provided FastAPI `app`.
    """

    def __init__(self, app):
        self.app = app
        # project root is two parents up from this file (config/)
        self.project_root = Path(__file__).resolve().parents[1]
        self.apps_directory = self.project_root / "apps"

    def import_routers(self):
        if not self.apps_directory.exists():
            logger.error(f"Apps directory not found: {self.apps_directory}")
            return

        for app_dir in self.apps_directory.iterdir():
            if not app_dir.is_dir():
                continue
            routers_file = app_dir / "routers.py"
            if not routers_file.exists():
                continue

            module_name = f"apps.{app_dir.name}.routers"
            try:
                module = importlib.import_module(module_name)
                if hasattr(module, "router"):
                    self.app.include_router(module.router)
                    logger.info(f"Imported router: {module_name}")
                else:
                    logger.warning(f"No 'router' found in {module_name}")
            except Exception as exc:
                logger.error(f"Failed to import {module_name}: {exc}", exc_info=True)
