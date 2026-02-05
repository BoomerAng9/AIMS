import os
import subprocess
from typing import Any, Optional

from ii_tool.core.workspace import FileSystemValidationError, WorkspaceManager
from ii_tool.tools.base import BaseTool, ToolResult
from ii_tool.logger import get_logger


NAME = "save_checkpoint"
DISPLAY_NAME = "Save checkpoint"
DESCRIPTION = (
    "Save a checkpoint of the work the agents have done. This must be called after the user's task is done, or after a major change have been implemented."
    "Always call this tool when you have done testing and ensure the required functionalities are implemented"
)
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_directory": {
            "type": "string",
            "description": "Absolute or workspace-relative path to the project root.",
        },
        "commit_message": {
            "type": "string",
            "description": "git commit message (default: 'Checkpoint').",
        },
    },
    "required": ["project_directory", "commit_message"],
}
DEFAULT_COMMIT_MESSAGE = "Checkpoint"
GIT_USER_EMAIL = "bot@example.com"
GIT_USER_NAME = "II Agent"
logger = get_logger("ii_tool.dev.save_checkpoint")


class SaveCheckpointTool(BaseTool):
    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = False

    def __init__(self, workspace_manager: WorkspaceManager) -> None:
        super().__init__()
        self.workspace_manager = workspace_manager

    async def execute(self, tool_input: dict[str, Any]) -> ToolResult:
        raw_path = tool_input["project_directory"].strip()
        commit_message = tool_input.get("commit_message") or DEFAULT_COMMIT_MESSAGE

        logger.info("Starting save_checkpoint for %s", raw_path)

        try:
            project_dir = self._resolve_directory(raw_path)
        except FileSystemValidationError as exc:
            logger.error("Invalid project directory %s: %s", raw_path, exc)
            return ToolResult(llm_content=str(exc), is_error=True)

        try:
            logger.info("Running build in %s", project_dir)
            build_result = self._run_command(
                ["bun", "run", "build:local"], project_dir, "bun run build:local"
            )
        except RuntimeError as exc:
            logger.exception("Build command failed to start in %s", project_dir)
            return ToolResult(llm_content=str(exc), is_error=True)

        if build_result.returncode != 0:
            logger.error(
                "Build failed in %s with exit code %s",
                project_dir,
                build_result.returncode,
            )
            return ToolResult(
                llm_content=self._format_failure_message(
                    "Build failed", build_result.stdout, build_result.stderr
                ),
                user_display_content={
                    "stage": "build",
                    "stdout": build_result.stdout,
                    "stderr": build_result.stderr,
                    "exit_code": build_result.returncode,
                },
                is_error=True,
            )

        try:
            logger.info("Cleaning Next.js build artifacts in %s", project_dir)
            cleanup_result = self._run_command(
                ["rm", "-rf", ".next-build"], project_dir, "rm -rf .next-build"
            )
        except RuntimeError as exc:
            logger.exception("Cleanup command failed to start in %s", project_dir)
            return ToolResult(llm_content=str(exc), is_error=True)

        if cleanup_result.returncode != 0:
            logger.error(
                "Cleanup failed in %s with exit code %s",
                project_dir,
                cleanup_result.returncode,
            )
            return ToolResult(
                llm_content=self._format_failure_message(
                    "Cleanup failed", cleanup_result.stdout, cleanup_result.stderr
                ),
                user_display_content={
                    "stage": "cleanup",
                    "stdout": cleanup_result.stdout,
                    "stderr": cleanup_result.stderr,
                    "exit_code": cleanup_result.returncode,
                },
                is_error=True,
            )

        try:
            logger.info("Build succeeded for %s, preparing git snapshot", project_dir)

            config_result = self._ensure_git_config(project_dir)
            if config_result is not None:
                return config_result

            git_dir = os.path.join(project_dir, ".git")
            if not os.path.isdir(git_dir):
                logger.info("Initializing git repository in %s", project_dir)
                init_result = self._run_command(
                    ["git", "init"], project_dir, "git init"
                )
                if init_result.returncode != 0:
                    logger.error(
                        "git init failed in %s with exit code %s",
                        project_dir,
                        init_result.returncode,
                    )
                    return ToolResult(
                        llm_content=self._format_failure_message(
                            "git init failed", init_result.stdout, init_result.stderr
                        ),
                        user_display_content={
                            "stage": "git_init",
                            "stdout": init_result.stdout,
                            "stderr": init_result.stderr,
                            "exit_code": init_result.returncode,
                        },
                        is_error=True,
                    )

            logger.info("Staging changes in %s", project_dir)
            add_result = self._run_command(
                ["git", "add", "-A"], project_dir, "git add"
            )
            if add_result.returncode != 0:
                logger.error(
                    "git add failed in %s with exit code %s",
                    project_dir,
                    add_result.returncode,
                )
                return ToolResult(
                    llm_content=self._format_failure_message(
                        "git add failed", add_result.stdout, add_result.stderr
                    ),
                    user_display_content={
                        "stage": "git_add",
                        "stdout": add_result.stdout,
                        "stderr": add_result.stderr,
                        "exit_code": add_result.returncode,
                    },
                    is_error=True,
                )

            logger.info("Creating checkpoint commit in %s", project_dir)
            commit_result = self._run_command(
                ["git", "commit", "-m", commit_message], project_dir, "git commit"
            )
            if commit_result.returncode != 0:
                logger.error(
                    "git commit failed in %s with exit code %s",
                    project_dir,
                    commit_result.returncode,
                )
                return ToolResult(
                    llm_content=self._format_failure_message(
                        "git commit failed", commit_result.stdout, commit_result.stderr
                    ),
                    user_display_content={
                        "stage": "git_commit",
                        "stdout": commit_result.stdout,
                        "stderr": commit_result.stderr,
                        "exit_code": commit_result.returncode,
                    },
                    is_error=True,
                )

            logger.info("Retrieving HEAD revision in %s", project_dir)
            rev_result = self._run_command(
                ["git", "rev-parse", "HEAD"], project_dir, "git rev-parse"
            )
        except RuntimeError as exc:
            logger.exception("Git command failed to start in %s", project_dir)
            return ToolResult(llm_content=str(exc), is_error=True)

        if rev_result.returncode != 0:
            logger.error(
                "git rev-parse failed in %s with exit code %s",
                project_dir,
                rev_result.returncode,
            )
            return ToolResult(
                llm_content=self._format_failure_message(
                    "Could not read git revision", rev_result.stdout, rev_result.stderr
                ),
                user_display_content={
                    "stage": "git_rev_parse",
                    "stdout": rev_result.stdout,
                    "stderr": rev_result.stderr,
                    "exit_code": rev_result.returncode,
                },
                is_error=True,
            )

        revision = rev_result.stdout.strip()
        logger.info("Checkpoint created at %s in %s", revision, project_dir)
        return ToolResult(
            llm_content=f"Checkpoint created at {revision}",
            user_display_content={
                "project_directory": project_dir,
                "revision": revision,
                "build_stdout": build_result.stdout,
                "build_stderr": build_result.stderr,
                "cleanup_stdout": cleanup_result.stdout,
                "cleanup_stderr": cleanup_result.stderr,
            },
            is_error=False,
        )

    def _resolve_directory(self, candidate: str) -> str:
        workspace_root = str(self.workspace_manager.get_workspace_path())
        path = candidate
        if not os.path.isabs(path):
            path = os.path.join(workspace_root, path)
        self.workspace_manager.validate_existing_directory_path(path)
        return path

    def _run_command(self, command: list[str], cwd: str, label: str) -> subprocess.CompletedProcess[str]:
        try:
            return subprocess.run(
                command,
                cwd=cwd,
                text=True,
                capture_output=True,
                check=False,
            )
        except FileNotFoundError as exc:
            message = f"Command `{label}` is not available: {exc}"
            raise RuntimeError(message) from exc

    def _format_failure_message(self, prefix: str, stdout: str, stderr: str) -> str:
        stderr = stderr.strip()
        stdout = stdout.strip()
        if stderr:
            return f"{prefix}. stderr: {stderr}"
        if stdout:
            return f"{prefix}. stdout: {stdout}"
        return f"{prefix}."

    def _ensure_git_config(self, project_dir: str) -> Optional[ToolResult]:
        logger.info("Ensuring git identity configuration for %s", project_dir)
        commands = [
            (
                ["git", "config", "--global", "user.email", GIT_USER_EMAIL],
                "git_config_email",
                "git config --global user.email",
            ),
            (
                ["git", "config", "--global", "user.name", GIT_USER_NAME],
                "git_config_name",
                "git config --global user.name",
            ),
        ]

        for command, stage, label in commands:
            try:
                result = self._run_command(command, project_dir, label)
            except RuntimeError as exc:
                logger.exception("Failed to run %s in %s", label, project_dir)
                return ToolResult(llm_content=str(exc), is_error=True)

            if result.returncode != 0:
                logger.error(
                    "%s failed in %s with exit code %s",
                    label,
                    project_dir,
                    result.returncode,
                )
                return ToolResult(
                    llm_content=self._format_failure_message(
                        f"{label} failed", result.stdout, result.stderr
                    ),
                    user_display_content={
                        "stage": stage,
                        "stdout": result.stdout,
                        "stderr": result.stderr,
                        "exit_code": result.returncode,
                    },
                    is_error=True,
                )

        return None

    async def execute_mcp_wrapper(
        self,
        project_directory: str,
        commit_message: str,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "project_directory": project_directory,
                "commit_message": commit_message,
            }
        )
