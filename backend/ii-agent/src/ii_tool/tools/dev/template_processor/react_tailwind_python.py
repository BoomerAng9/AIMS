import os
import subprocess
from ii_tool.tools.dev.template_processor.base_processor import BaseProcessor
from ii_tool.tools.dev.template_processor.registry import WebProcessorRegistry


def deployment_rule(project_path: str) -> str:
    return f"""Successfully initialized codebase:
```
{project_path}
├── backend/
│   ├── README.md
│   ├── requirements.txt
│   └── src/
│       ├── __init__.py
│       ├── main.py
│       └── tests/
│           └── __init__.py
└── frontend
    ├── README.md
    ├── bun.lock
    ├── components.json
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── public/
    │   └── _redirects
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   └── ui
    │   │       └── button.tsx
    │   ├── index.css
    │   ├── lib/
    │   │   └── utils.ts
    │   ├── main.tsx
    │   └── vite-env.d.ts
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```

Installed dependencies:
- Frontend: `bun install`
- Backend: `pip install -r requirements.txt`
```
fastapi
uvicorn
sqlalchemy
python-dotenv
pydantic
pydantic-settings
pytest
pytest-asyncio
httpx
openai
bcrypt
python-jose[cryptography]
python-multipart
cryptography
requests
```

Utilize the Shadcn UI library for the frontend. Add components with `bunx shadcn@latest add -y -o`. Import components with `@/` alias. Note, 'toast' is deprecated, use 'sonner' instead."""


@WebProcessorRegistry.register("react-shadcn-python")
class ReactShadcnPythonProcessor(BaseProcessor):
    template_name = "react-shadcn-python"

    def __init__(
        self,
        project_dir: str,
    ):
        super().__init__(project_dir)
        self.project_rule = deployment_rule(project_dir)

    def install_dependencies(self):
        frontend_dir = os.path.join(self.project_dir, "frontend")
        backend_dir = os.path.join(self.project_dir, "backend")

        install_result = subprocess.run(
            "bun install",
            shell=True,
            cwd=frontend_dir,
            capture_output=True,
        )
        if install_result.returncode != 0:
            raise Exception(
                f"Failed to install frontend dependencies automatically: {install_result.stderr.decode('utf-8')}. Please fix the error and run `bun install` in the frontend directory manually"
            )

        install_result = subprocess.run(
            "pip install -r requirements.txt",
            shell=True,
            cwd=backend_dir,
            capture_output=True,
        )
        if install_result.returncode != 0:
            raise Exception(
                f"Failed to install backend dependencies automatically: {install_result.stderr.decode('utf-8')}. Please fix the error and run `pip install -r requirements.txt` in the backend directory manually"
            )
