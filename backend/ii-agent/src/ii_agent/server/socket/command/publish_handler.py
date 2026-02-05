"""Handler for publishing a project."""

from __future__ import annotations

import hashlib
import os
import re
import shlex
from typing import Any, Dict

from ii_agent.core.event import EventType
from ii_agent.core.event_stream import EventStream
from ii_agent.server.models.sessions import SessionInfo
from ii_agent.server.shared import sandbox_service
from ii_agent.server.socket.command.command_handler import (
    CommandHandler,
    UserCommandType,
)
from fastmcp.exceptions import ToolError
from fastmcp.client.client import CallToolResult
from ii_tool.mcp.client import MCPClient


class PublishProjectHandler(CommandHandler):
    """Handler for publishing a project"""

    _SUCCESS_MARKER = "__II_PUBLISH_SUCCESS__"

    def __init__(self, event_stream: EventStream) -> None:
        """Initialize the publish project handler with required dependencies.

        Args:
            event_stream: Event stream for publishing events
        """
        super().__init__(event_stream=event_stream)

    def get_command_type(self) -> UserCommandType:
        return UserCommandType.PUBLISH_PROJECT

    async def handle(self, content: Dict[str, Any], session_info: SessionInfo) -> None:
        """Handle project deployment to Vercel inside the sandbox."""
        project_path = self._resolve_project_path(content.get("project_path"), session_info)
        if not project_path:
            await self._send_error_event(
                str(session_info.id),
                message="Project path is required to publish the project.",
                error_type="missing_project_path",
            )
            return

        project_name = self._resolve_project_name(
            content.get("project_name"), project_path
        )
        vercel_api_key = self._extract_api_key(content)
        if not vercel_api_key:
            await self._send_error_event(
                str(session_info.id),
                message="Vercel API key is required for deployment.",
                error_type="missing_credentials",
            )
            return

        session_id = session_info.id
        session_id_hash = hashlib.sha256(str(session_id).encode()).hexdigest()[:8]
        project_id = f"{project_name}-ii-{session_id_hash}"
        shell_session_name = f"deploy-{session_id_hash}"

        sandbox = await sandbox_service.get_sandbox_by_session(session_id)
        mcp_port = sandbox_service.config.mcp_port
        sandbox_url = await sandbox.expose_port(mcp_port)

        # import ipdb; ipdb.set_trace()
        async with MCPClient(sandbox_url) as client:
            await self._ensure_shell_session(
                client,
                shell_session_name,
                project_path,
            )
            # import ipdb; ipdb.set_trace()

            # await self._send_event(
            #     session_id=session_id,
            #     message=f"Building project {project_name}...",
            #     event_type=EventType.STATUS_UPDATE,
            # )

            # build_command = self._append_success_marker(
            #     f"cd /workspace/{project_name} && bun run build"
            # )

            # try:
            #     build_output = await self._run_shell_command(
            #         client,
            #         shell_session_name,
            #         build_command,
            #         description="Run project build",
            #         timeout=179,
            #     )
            # except Exception as exc:  # noqa: BLE001
            #     await self._send_error_event(
            #         str(session_id),
            #         message=(
            #             "Failed to build project.\n"
            #             f"Details: {exc}"
            #         ),
            #         error_type="deploy_link_failed",
            #     )
            #     return

            # if not self._command_succeeded(build_output):
            #     await self._send_error_event(
            #         str(session_id),
            #         message=(
            #             "Failed to build project.\n"
            #             f"Output: {self._cleanup_output(build_output) or 'No output returned.'}"
            #         ),
            #         error_type="deploy_link_failed",
            #     )
            #     return

            await self._send_event(
                session_id=session_id,
                message=f"Linking {project_id} with Vercel...",
                event_type=EventType.STATUS_UPDATE,
            )

            link_command = self._append_success_marker(
                f"cd /workspace/{project_name} && "
                f"vercel link --yes --project {self._shell_quote(project_id)} --token {self._shell_quote(vercel_api_key)}"
            )

            try:
                link_output = await self._run_shell_command(
                    client,
                    shell_session_name,
                    link_command,
                    description="Link Vercel project",
                    timeout=179,
                )
            except Exception as exc:  # noqa: BLE001
                await self._send_error_event(
                    str(session_id),
                    message=(
                        "Failed to link project with Vercel.\n"
                        f"Details: {exc}"
                    ),
                    error_type="deploy_link_failed",
                )
                return

            if not self._command_succeeded(link_output):
                await self._send_error_event(
                    str(session_id),
                    message=(
                        "Failed to link project with Vercel.\n"
                        f"Output: {self._cleanup_output(link_output) or 'No output returned.'}"
                    ),
                    error_type="deploy_link_failed",
                )
                return

            await self._send_event(
                session_id=session_id,
                message="Project linked successfully.",
                event_type=EventType.STATUS_UPDATE,
            )

            await self._send_event(
                session_id=session_id,
                message="Running production deployment...",
                event_type=EventType.STATUS_UPDATE,
            )

            deploy_command = (
                f"cd /workspace/{project_name} && "
                f"vercel --prod --token {self._shell_quote(vercel_api_key)} -y"
            )
            deploy_command = self._append_success_marker(deploy_command)

            try:
                deploy_output = await self._run_shell_command(
                    client,
                    shell_session_name,
                    deploy_command,
                    description="Deploy project to Vercel",
                    timeout=179,
                )
            except Exception as exc:  # noqa: BLE001
                await self._send_error_event(
                    str(session_id),
                    message=(
                        "Vercel deployment failed.\n"
                        f"Details: {exc}"
                    ),
                    error_type="deploy_failed",
                )
                return

            if not self._command_succeeded(deploy_output):
                await self._send_error_event(
                    str(session_id),
                    message=(
                        "Vercel deployment failed.\n"
                        f"Output: {self._cleanup_output(deploy_output) or 'No output returned.'}"
                    ),
                    error_type="deploy_failed",
                )
                return

            cleaned_output = self._cleanup_output(deploy_output)
            deployment_url = self._extract_deployment_url(cleaned_output, project_id)

        await self._send_event(
            session_id=session_id,
            message=f"Deployment live at {deployment_url}",
            event_type=EventType.SYSTEM,
            deployment_url=deployment_url,
            project_id=project_id,
            project_name=project_name,
            deployment={
                "url": deployment_url,
                "project_id": project_id,
                "project_name": project_name,
            },
        )

    def _resolve_project_path(
        self, project_path: str | None, session_info: SessionInfo
    ) -> str | None:
        if isinstance(project_path, str) and project_path.strip():
            project_path = project_path.strip()
        else:
            project_path = session_info.workspace_dir

        if not isinstance(project_path, str) or not project_path:
            return None

        if project_path.startswith("./"):
            project_path = project_path[2:]

        if not os.path.isabs(project_path):
            project_path = os.path.join(session_info.workspace_dir, project_path)

        return project_path.rstrip()

    def _extract_api_key(self, content: Dict[str, Any]) -> str | None:
        key = content.get("vercel_api_key")
        if isinstance(key, str) and key.strip():
            return key.strip()

        credentials = content.get("credentials")
        if isinstance(credentials, dict):
            key_candidate = credentials.get("vercel_api_key")
            if isinstance(key_candidate, str) and key_candidate.strip():
                return key_candidate.strip()

        token = content.get("token")
        if isinstance(token, str) and token.strip():
            return token.strip()

        return None

    async def _collect_env_from_files(
        self,
        client: MCPClient,
        session_name: str,
        project_path: str,
    ) -> dict[str, str]:
        env_vars: dict[str, str] = {}
        base_command = f"cd {self._shell_quote(project_path)} && "
        for filename in (".env", ".env.local"):
            command = f"{base_command}if [ -f {filename} ]; then cat {filename}; fi"
            command = self._append_success_marker(command)
            try:
                output = await self._run_shell_command(
                    client,
                    session_name,
                    command,
                    description=f"Read {filename} environment file",
                    timeout=179,
                )
            except Exception:  # noqa: BLE001
                continue
            env_vars.update(self._parse_env_file(self._cleanup_output(output)))
        return env_vars

    def _parse_env_file(self, content: str) -> dict[str, str]:
        env_vars: dict[str, str] = {}
        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if line.lower().startswith("export "):
                line = line[7:].strip()
            if "=" not in line:
                continue
            name, value = line.split("=", 1)
            name = name.strip()
            if not name:
                continue
            value = value.strip()
            if value.startswith(("'", '"')) and value.endswith(("'", '"')) and len(value) >= 2:
                value = value[1:-1]
            env_vars[name] = value
        return env_vars

    def _parse_env_payload(self, env_payload: Any) -> dict[str, str]:
        env_vars: dict[str, str] = {}
        if isinstance(env_payload, dict):
            for name, value in env_payload.items():
                if isinstance(name, str) and name:
                    env_vars[name] = "" if value is None else str(value)
        elif isinstance(env_payload, list):
            for item in env_payload:
                if not isinstance(item, dict):
                    continue
                name = item.get("name")
                value = item.get("value")
                if isinstance(name, str) and name:
                    env_vars[name] = "" if value is None else str(value)
        return env_vars

    def _format_env_flags(self, env_vars: dict[str, str]) -> str:
        flags: list[str] = []
        for name, value in env_vars.items():
            combined = f"{name}={value}"
            flags.append(f"--env {self._shell_quote(combined)}")
        return " ".join(flags)

    async def _ensure_shell_session(
        self,
        client: MCPClient,
        session_name: str,
        start_directory: str,
    ) -> None:
        tool_name = "BashInit"
        arguments = {
            "session_name": session_name,
        }
        await client.call_tool(tool_name, arguments)

    async def _run_shell_command(
        self,
        client: MCPClient,
        session_name: str,
        command: str,
        *,
        description: str,
        timeout: int = 600,
        wait_for_output: bool = True,
    ) -> str:
        tool_name =  "Bash"
        arguments = {
            "session_name": session_name,
            "command": command,
            "description": description,
            "timeout": timeout,
            "wait_for_output": wait_for_output,
        }

        last_error: Exception | None = None
        try:
            result = await client.call_tool(tool_name, arguments)
            return self._extract_tool_output(result)
        except Exception as exc:  # noqa: BLE001
            last_error = exc

        if last_error:
            raise last_error
        return ""

    def _extract_tool_output(self, result: CallToolResult) -> str:
        structured = result.structured_content or {}
        display = structured.get("user_display_content")
        if isinstance(display, str):
            return display
        if isinstance(display, list):
            return "\n".join(str(item) for item in display)

        texts: list[str] = []
        for block in result.content:
            text = getattr(block, "text", None)
            if isinstance(text, str):
                texts.append(text)
        return "\n".join(texts)

    def _append_success_marker(self, command: str) -> str:
        return f"{command} && echo {self._SUCCESS_MARKER}"

    def _command_succeeded(self, output: str) -> bool:
        return bool(output and self._SUCCESS_MARKER in output)

    def _cleanup_output(self, output: str) -> str:
        if not output:
            return ""
        return output.replace(self._SUCCESS_MARKER, "").strip()

    def _extract_deployment_url(self, output: str, project_id: str) -> str:
        if output:
            production_match = re.search(
                r"Production:\s*(https://[^\s\]]+)", output, re.IGNORECASE
            )
            if production_match:
                return production_match.group(1)
            vercel_match = re.search(
                r"https://[^\s\]]+vercel\.app", output, re.IGNORECASE
            )
            if vercel_match:
                return vercel_match.group(0)
            generic_match = re.search(r"https://[^\s\]]+", output)
            if generic_match:
                return generic_match.group(0)
        return f"https://{project_id}.vercel.app"

    def _shell_quote(self, value: str) -> str:
        return shlex.quote(value)

    def _resolve_project_name(
        self, provided_name: Any, project_path: str
    ) -> str:
        if isinstance(provided_name, str) and provided_name.strip():
            candidate = provided_name.strip()
        else:
            candidate = os.path.basename(project_path.rstrip(os.sep)) or "project"

        sanitized = re.sub(r"[^a-zA-Z0-9-]+", "-", candidate)
        sanitized = sanitized.strip("-")
        return sanitized.lower() or "project"
