import logging
import uuid
from typing import Optional

from ii_agent.core.event import RealtimeEvent, EventType
from ii_agent.db.manager import Events, get_db_session_local
from ii_agent.subscribers.subscriber import EventSubscriber
from ii_tool.tools.slide_system.slide_edit_tool import SlideEditTool
from ii_tool.tools.slide_system.slide_patch import SlideApplyPatchTool
from ii_tool.tools.slide_system.slide_write_tool import SlideWriteTool


class DatabaseSubscriber(EventSubscriber):
    """Subscriber that handles database storage for events."""

    def __init__(self, logger: logging.Logger = None):
        self._logger = logger or logging.getLogger(__name__)

    async def handle_event(self, event: RealtimeEvent) -> None:
        """Handle an event by saving it to the database."""
        # Save all events to database if we have a session
        if not await self.should_handle(event):
            return
        
        if event.type == EventType.USER_MESSAGE:
            # Skip saving user message events to avoid duplication
            return
        
        if not event.session_id:
            self._logger.warning(
                f"DatabaseSubscriber: Event has no session_id, skipping save: {event}"
            )
            return
     
        # Handle file URLs from image/video generation tools
        if event.type == EventType.TOOL_RESULT:
            tool_result = event.content.get("result", {})
            tool_name = event.content.get("tool_name", "")

            # Special handling for file_url type results (image/video generation)
            if (
                isinstance(tool_result, dict)
                and tool_result.get("type") == "file_url"
            ):
                # Import here to avoid circular imports
                from ii_agent.server.shared import file_service

                file_data = await file_service.write_file_from_url(
                    url=tool_result["url"],
                    file_name=tool_result["name"],
                    file_size=tool_result["size"],
                    content_type=tool_result["mime_type"],
                    session_id=str(event.session_id),
                )
                event.content["result"]["file_id"] = file_data.id
                event.content["result"]["file_storage_path"] = (
                    file_data.storage_path
                )

            # Special handling for slide tool results
            if tool_name in [
                SlideWriteTool.name,
                SlideEditTool.name,
                SlideApplyPatchTool.name,
            ]:
                self._logger.info(
                    f"Handling slide tool result for tool: {tool_name}"
                )
                await self._handle_slide_tool_result(event, tool_name)

            # All tool results (including non-file results) are saved with the event
        try:
            await Events.save_event(event.session_id, event)
        except Exception:
            self._logger.exception(
                f"Error saving event to database: event_type={event.type}, "
                f"session_id={event.session_id}, event={event.model_dump_json()}"
            )
            raise

    async def _handle_slide_tool_result(
        self, event: RealtimeEvent, tool_name: str
    ) -> None:
        """Handle slide tool results and save to database."""
        try:
            # Import here to avoid circular imports
            from ii_agent.server.slides.service import _save_slide_to_db

            tool_input = event.content.get("tool_input", {})
            tool_result = event.content.get("result", {})

            # For SlideApplyPatchTool, handle multiple slides from user_display_content
            if tool_name == SlideApplyPatchTool.name:
                await self._handle_slide_apply_patch_result(event)
                return

            # Extract presentation info from tool input for other slide tools
            presentation_name = tool_input.get("presentation_name")
            slide_number = tool_input.get("slide_number")

            if not presentation_name or not slide_number:
                self._logger.warning(f"Missing presentation info in {tool_name} result")
                return

            # Get slide content based on tool type
            slide_content = None
            slide_title = ""

            # user_display = tool_result if isinstance(tool_result, dict) else
            if isinstance(tool_result, dict):
                user_display = tool_result
            elif isinstance(tool_result, list) and len(tool_result) > 0:
                user_display = tool_result[0]
            else:
                user_display = {}

            if tool_name == SlideWriteTool.name:
                if isinstance(user_display, dict):
                    slide_content = user_display.get("content", "")
                slide_title = tool_input.get("title", "")

            elif tool_name == SlideEditTool.name:
                slide_content = user_display.get("new_content", "")
                slide_title = tool_input.get("title", "")

            if not slide_content:
                self._logger.warning(f"No content found in {tool_name} result")
                return

            # Save to database using the service function
            async with get_db_session_local() as db_session:
                await _save_slide_to_db(
                    db_session=db_session,
                    session_id=str(event.session_id),
                    presentation_name=presentation_name,
                    slide_number=slide_number,
                    slide_title=slide_title,
                    slide_content=slide_content,
                    tool_name=tool_name,
                )
                self._logger.info(
                    f"Saved {tool_name} result for slide {slide_number} in {presentation_name}"
                )

        except Exception as e:
            self._logger.error(f"Error handling {tool_name} result: {e}", exc_info=True)

    async def _handle_slide_apply_patch_result(self, event: RealtimeEvent) -> None:
        """Handle SlideApplyPatchTool results which can contain multiple slides."""
        try:
            # Import here to avoid circular imports
            from ii_agent.server.slides.service import _save_slide_to_db

            # QUICKFIX: quickfix for slide_apply_patch, should be refactor

            tool_result = event.content.get("result", {})

            # Process each slide in the result
            for slide_data in tool_result:
                if not isinstance(slide_data, dict):
                    continue

                # Extract filepath to get presentation_name and slide_number
                filepath = slide_data.get("filepath", "")
                if not filepath.startswith("/workspace/"):
                    continue

                # Parse filepath: /workspace/presentations/{presentation_name}/slide_{number}.html
                path_parts = filepath.replace("/workspace/presentations/", "").split(
                    "/"
                )
                if len(path_parts) < 2:
                    continue

                presentation_name = path_parts[0]
                slide_filename = path_parts[1]

                # Extract slide number from filename (e.g., slide_1.html -> 1)
                if not slide_filename.startswith(
                    "slide_"
                ) or not slide_filename.endswith(".html"):
                    continue

                try:
                    slide_number = int(
                        slide_filename.replace("slide_", "").replace(".html", "")
                    )
                except ValueError:
                    continue

                # Get slide content
                slide_content = slide_data.get("new_content", "")
                if not slide_content:
                    continue

                # Save to database
                async with get_db_session_local() as db_session:
                    await _save_slide_to_db(
                        db_session=db_session,
                        session_id=str(event.session_id),
                        presentation_name=presentation_name,
                        slide_number=slide_number,
                        slide_title="",  # SlideApplyPatchTool doesn't provide title in user_display_content
                        slide_content=slide_content,
                        tool_name=SlideApplyPatchTool.name,
                    )
                    self._logger.info(
                        f"Saved SlideApplyPatchTool result for slide {slide_number} in {presentation_name}"
                    )

        except Exception as e:
            self._logger.error(
                f"Error handling SlideApplyPatchTool result: {e}", exc_info=True
            )
