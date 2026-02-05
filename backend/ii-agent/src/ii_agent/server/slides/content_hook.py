"""Slide content hook for processing slide tool results."""

import logging
from typing import Optional
from copy import deepcopy

from ii_agent.core.event import RealtimeEvent, EventType
from ii_agent.core.event_hooks import EventHook
from ii_agent.server.slides.content_processor import SlideContentProcessor
from ii_agent.storage.base import BaseStorage
from ii_agent.sandbox import IISandbox

logger = logging.getLogger(__name__)


class SlideContentHook(EventHook):
    """Hook that processes slide tool results to replace local paths with permanent URLs."""

    def __init__(self, storage: BaseStorage, sandbox: IISandbox):
        self.storage = storage
        self.sandbox = sandbox
        self.content_processor = SlideContentProcessor(storage, sandbox)

    def should_process(self, event: RealtimeEvent) -> bool:
        """Check if this is a slide tool result that should be processed."""
        if event.type != EventType.TOOL_RESULT:
            return False

        tool_name = event.content.get("tool_name", "")
        return tool_name in ["SlideWrite", "SlideEdit", "slide_apply_patch"]

    async def process_event(self, event: RealtimeEvent) -> Optional[RealtimeEvent]:
        """Process slide tool result to replace local paths with permanent URLs."""
        try:
            # Deep copy to avoid modifying original event
            processed_event = RealtimeEvent(
                type=event.type,
                session_id=event.session_id,
                content=deepcopy(event.content),
            )

            tool_name = processed_event.content.get("tool_name", "")
            logger.debug(f"Processing slide tool result for: {tool_name}")

            logger.debug(f"Event content: {processed_event.content}")

            # Handle different result structures based on tool
            user_display = processed_event.content.get("result")

            if tool_name == "slide_apply_patch":
                # Handle slide_apply_patch which has user_display_content list
                user_display_content = user_display
                if not user_display_content:
                    logger.warning(
                        f"No user_display_content found in {tool_name} tool result"
                    )
                    return processed_event

                # Process each slide in the list
                for i, slide_data in enumerate(user_display_content):
                    if not isinstance(slide_data, dict):
                        continue

                    html_content = slide_data.get("new_content")
                    slide_file_path = slide_data.get("filepath")

                    if html_content and slide_file_path:
                        # Process the HTML content
                        processed_html = (
                            await self.content_processor.process_html_content(
                                html_content, slide_file_path
                            )
                        )
                        # Update the content in the event
                        processed_event.content["result"][i]["new_content"] = (
                            processed_html
                        )

            elif isinstance(user_display, dict) and "content" in user_display:
                # Handle SlideWrite - single slide with content field
                html_content = user_display["content"]
                slide_file_path = user_display.get("filepath")

                if html_content and slide_file_path:
                    # Process the HTML content
                    processed_html = await self.content_processor.process_html_content(
                        html_content, slide_file_path
                    )
                    # Update the content in the event
                    processed_event.content["result"]["content"] = processed_html

            elif isinstance(user_display, list) and len(user_display) > 0:
                # Handle SlideEdit - process all items in the list
                for i, item in enumerate(user_display):
                    if isinstance(item, dict) and "new_content" in item:
                        html_content = item["new_content"]
                        slide_file_path = item.get("filepath")

                        if html_content and slide_file_path:
                            # Process the HTML content
                            processed_html = (
                                await self.content_processor.process_html_content(
                                    html_content, slide_file_path
                                )
                            )
                            # Update the content in the event
                            processed_event.content["result"][i]["new_content"] = (
                                processed_html
                            )
            else:
                logger.warning(
                    f"No processable content found in {tool_name} tool result"
                )
                return processed_event

            logger.debug(f"Successfully processed slide content for {tool_name}")
            return processed_event

        except Exception as e:
            logger.error(f"Error processing slide content hook: {e}")
            return event  # Return original event on error
