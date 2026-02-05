import os

from typing import Any
from ii_tool.tools.dev.template_processor.registry import WebProcessorRegistry
from ii_tool.tools.base import BaseTool, ToolResult
from ii_tool.core.workspace import WorkspaceManager


# Name
NAME = "fullstack_project_init"
DISPLAY_NAME = "Initialize application template"

# Description
DESCRIPTION = """Initializes a complete fullstack web application from pre-configured templates with modern development tools and best practices.
## Overview
This tool scaffolds production-ready fullstack applications with automated dependency management, testing infrastructure, and deployment configurations. Choose from optimized templates that include modern UI components, authentication, database integration, and comprehensive testing setups.
## Available Frameworks (default: nextjs-shadcn)
### nextjs-shadcn
Modern TypeScript fullstack with premium UI components
- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui components
- Build Tools: Bun package manager, Biome linter/formatter, Jest testing
- Features: Server-side rendering, built-in authentication (NextAuth), Prisma ORM, advanced animations (Framer Motion), real-time features (Socket.io)
- Use Case: Enterprise applications, content management systems, e-commerce platforms
### react-shadcn-python
Fullstack JavaScript + Python with FastAPI backend
- Frontend: React + Vite, JavaScript, Tailwind CSS, shadcn/ui components
- Backend: FastAPI, SQLAlchemy, Pydantic, comprehensive testing suite
- Build Tools: Bun (frontend), pip (backend), automated testing with pytest
- Features: REST API, JWT authentication, database migrations, OpenAPI documentation
- Use Case: API-driven applications, data dashboards, microservices architecture
## Development Guidelines
### Backend Standards
- Testing Requirements: Comprehensive test coverage for all endpoints and business logic
  * Unit tests for all functions and classes
  * Integration tests for API endpoints
  * Edge case and error handling coverage
  * All tests must pass before deployment
- API Design: Follow RESTful principles with OpenAPI documentation
- Security: Input validation, authentication, authorization, SQL injection prevention
### Frontend Standards
- UI/UX: Modern, responsive design using Tailwind CSS utility classes
- Component Architecture: Reusable, composable React components
- State Management: Context API or external libraries as needed
- Performance: Code splitting, lazy loading, optimized builds
- Accessibility: WCAG compliance, semantic HTML, proper ARIA labels
### Deployment Configuration
- Default Ports:
  * Backend: `8080` (auto-increment if unavailable)
  * Frontend: `3000` (auto-increment if unavailable)
- Environment: Development, staging, and production configurations
- Monitoring: Error tracking, performance monitoring, logging
### Debugging Best Practices
- API Testing: Test all endpoints with appropriate HTTP clients
- Error Analysis: Monitor console output and application logs
- Documentation: Consult framework documentation and community resources
- Incremental Development: Test components and features iteratively
## Post-Initialization Steps
1. Navigate to project directory: `cd <project_name>`
2. Install dependencies (automatically handled by tool)
3. Start development servers
4. Review generated documentation and project structure
5. Begin feature development following established patterns
## Quality Assurance
- All templates include pre-configured linting and formatting
- Automated testing infrastructure is ready for immediate use
- Security best practices are implemented by default
- Performance optimizations are built into the build process
"""
# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_name": {
            "type": "string",
            "description": "A name for your project (lowercase, no spaces, use hyphens - if needed). Example: `my-app`, `todo-app`",
        },
        "framework": {
            "type": "string",
            "description": "The framework to use for the project",
            "enum": ["nextjs-shadcn", "react-shadcn-python"],
        },
    },
    "required": ["project_name", "framework"],
}

class FullStackInitTool(BaseTool):
    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = False

    def __init__(
        self,
        workspace_manager: WorkspaceManager,
    ) -> None:
        super().__init__()
        self.workspace_manager = workspace_manager

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        project_name = tool_input["project_name"]
        framework = tool_input["framework"]
        project_dir = os.path.join(
            self.workspace_manager.get_workspace_path(), project_name
        )
        if os.path.exists(project_dir):
            return ToolResult(
                llm_content=f"Project directory {project_dir} already exists, please choose a different project name",
                user_display_content="Project directory already exists, please choose a different project name",
                is_error=True,
            )

        os.makedirs(project_dir, exist_ok=True)

        processor = WebProcessorRegistry.create(
            framework,
            project_dir,
        )
        try:
            processor.start_up_project()
        except Exception as e:
            return ToolResult(
                llm_content=f"Failed to start up project in {project_dir}: {e}",
                user_display_content=f"Failed to start up project in {project_dir}: {e}",
                is_error=True,
            )

        project_metadata = {
            "type": "fullstack_project_metadata",
            "project_name": project_name,
            "framework": framework,
            "project_directory": project_dir,
            "template": getattr(processor, "template_name", framework),
            "project_rule": processor.get_project_rule(),
        }

        return ToolResult(
            llm_content=(
                f"Successfully initialized fullstack web application in {project_dir}. "
                f"Framework: {framework}."
            ),
            user_display_content=[project_metadata],
            is_error=False,
        )

    async def execute_mcp_wrapper(
        self,
        project_name: str,
        framework: str,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "project_name": project_name,
                "framework": framework,
            }
        )
