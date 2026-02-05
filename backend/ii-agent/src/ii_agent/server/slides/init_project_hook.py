"""Event hook to persist project metadata for fullstack init tool."""

from __future__ import annotations

from copy import deepcopy
import logging
from typing import Any, Dict, List, Optional

from ii_agent.core.event import EventType, RealtimeEvent
from ii_agent.core.event_hooks import EventHook
from ii_agent.db.manager import Projects
from ii_tool.tools.dev import FullStackInitTool


logger = logging.getLogger(__name__)


class InitProjectHook(EventHook):
    """Hook that stores initialized projects and enriches tool output."""

    def __init__(self) -> None:
        self._tool_name = FullStackInitTool.name

    def should_process(self, event: RealtimeEvent) -> bool:
        if event.type != EventType.TOOL_RESULT:
            return False
        content = event.content or {}
        return content.get("tool_name") == self._tool_name

    async def process_event(self, event: RealtimeEvent) -> Optional[RealtimeEvent]:
        if event.session_id is None:
            return event

        processed_event = RealtimeEvent(
            type=event.type,
            session_id=event.session_id,
            content=deepcopy(event.content),
            run_id=event.run_id,
        )

        raw_result = processed_event.content.get("result")
        if not isinstance(raw_result, list):
            return processed_event

        enriched_result: List[Any] = []
        for item in raw_result:
            if not isinstance(item, dict):
                enriched_result.append(item)
                continue

            if item.get("type") != "fullstack_project_metadata":
                enriched_result.append(item)
                continue

            project_name = item.get("project_name")
            if not isinstance(project_name, str):
                enriched_result.append(item)
                continue

            framework = item.get("framework")
            framework_str = framework if isinstance(framework, str) else None
            project_dir = item.get("project_directory")
            project_dir_str = project_dir if isinstance(project_dir, str) else None
            description = item.get("description")
            description_str = description if isinstance(description, str) else None

            try:
                project_record = await Projects.create_or_update_project(
                    session_id=str(processed_event.session_id),
                    project_name=project_name,
                    framework=framework_str,
                    project_path=project_dir_str,
                    description=description_str,
                )
            except Exception as exc:  # pragma: no cover - defensive
                logger.error("Failed to persist project metadata: %s", exc)
                project_record = None

            if project_record:
                item = {**item, "project": project_record}

            enriched_result.append(item)

        processed_event.content["result"] = enriched_result
        return processed_event
