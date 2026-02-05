import importlib
from pathlib import Path


def get_project_root() -> Path:
    try:
        dist = importlib.import_module("ii_agent")
        if dist.__file__:
            package_location = Path(str(dist.__file__)).resolve()
            while package_location.parent != package_location:
                if (package_location / "pyproject.toml").exists():
                    return package_location
                package_location = package_location.parent

        return package_location
    except Exception as e:
        raise Exception("Failed to get project root: " + str(e))