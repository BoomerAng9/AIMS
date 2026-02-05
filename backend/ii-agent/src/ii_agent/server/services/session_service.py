"""Session service for managing chat sessions."""

import uuid
import logging

from copy import deepcopy
from typing import Optional, List

from ii_agent.core.config.ii_agent_config import IIAgentConfig
from ii_agent.core.event import EventType
from ii_agent.server.models.sessions import SessionInfo
from ii_agent.storage import BaseStorage
from ii_agent.db.manager import Events, Sessions
from ii_agent.core.storage.locations import get_conversation_agent_state_path
from ii_agent.server.services.sandbox_service import SandboxService
from ii_agent.server.services.agent_service import AgentService

logger = logging.getLogger(__name__)


class SessionService:
    """Service for creating and managing chat sessions."""

    def __init__(
        self,
        agent_service: AgentService,
        sandbox_service: SandboxService,
        file_store: BaseStorage,
        config: IIAgentConfig,
    ):
        self.agent_service = agent_service
        self.sandbox_service = sandbox_service
        self.file_store = file_store
        self.config = config

    async def find_session_by_id(
        self, session_uuid: uuid.UUID
    ) -> Optional[SessionInfo]:
        # TODO: add cache later
        session = await Sessions.get_session_by_id(session_uuid)
        if session is not None:
            session_info = SessionInfo(
                id=uuid.UUID(session.id),
                user_id=session.user_id,
                name=session.name,
                status=session.status,
                sandbox_id=session.sandbox_id,
                agent_type=session.agent_type,
                created_at=session.created_at.isoformat(),
                updated_at=session.updated_at.isoformat(),
                workspace_dir=session.get_workspace_dir(),
                is_public=session.is_public,
                token_usage=None,
            )

            # await self.entity_cache.set(str(session_uuid), session_info.model_dump())
            return session_info
        return None

    async def create_new_session(
        self, session_uuid: uuid.UUID, user_id: str
    ) -> SessionInfo:
        session = await Sessions.create_session(
            session_uuid=session_uuid,
            user_id=user_id,
            agent_state_path=get_conversation_agent_state_path(str(session_uuid)),
        )
        return SessionInfo(
            id=str(session.id),
            user_id=session.user_id,
            name=session.name,
            status=session.status,
            sandbox_id=session.sandbox_id,
            agent_type=session.agent_type,
            created_at=session.created_at.isoformat(),
            updated_at=session.updated_at.isoformat(),
            workspace_dir=session.get_workspace_dir(),
            is_public=session.is_public,
            token_usage=None,
        )

    async def get_or_create_sessison(
        self, session_uuid: Optional[str], user_id: str
    ) -> SessionInfo:
        """Create a new chat session.

        Args:
            sockets: List of Socket.IO session IDs for broadcasting
            session_uuid: Optional session UUID, will generate if not provided
            user_id: Optional user ID for the session
            sio: Socket.IO server instance

        Returns:
            SessionInfo instance
        """
        # Generate session UUID if not provided
        if session_uuid:
            session = await self.find_session_by_id(uuid.UUID(session_uuid))
            if not session:
                raise ValueError(f"Session {session_uuid} not found")
        else:
            session = await self.create_new_session(uuid.uuid4(), user_id)
            
        return session

    async def ensure_session_exists(
        self, session_uuid: uuid.UUID, user_id: Optional[str] = None
    ) -> Optional[str]:
        """Ensure a database session exists for the given session ID.

        Args:
            session_uuid: The session UUID
            user_id: Optional user ID for creating new sessions

        Returns:
            The user_id from the session (existing or provided)

        Raises:
            ValueError: If no user_id provided for new session creation
        """
        existing_session = await Sessions.get_session_by_id(session_uuid)
        if existing_session:
            logger.info(
                f"Found existing session {session_uuid} for user {existing_session.user_id}"
            )
            return existing_session.user_id
        else:
            # Create new session if it doesn't exist
            # Require user_id since authentication is mandatory
            if not user_id:
                raise ValueError("Cannot create session without authenticated user_id")

            await Sessions.create_session(
                session_uuid=session_uuid,
                user_id=user_id,
                agent_state_path=get_conversation_agent_state_path(str(session_uuid)),
                name=None,  # Title will be set later when first message is received
            )

            logger.info(f"Created new session {session_uuid} for user {user_id}")
            return user_id

    async def update_session_agent_type(
        self, session_uuid: uuid.UUID, agent_type: str
    ) -> None:
        """Update the agent type for a session."""
        await Sessions.update_session_agent_type(session_uuid, agent_type)

    async def update_session_name(self, session_uuid: uuid.UUID, name: str) -> None:
        """Update the name for a session."""
        await Sessions.update_session_name(session_uuid, name)

    async def update_session_llm_setting_id(
        self, session_uuid: uuid.UUID, llm_setting_id: Optional[str]
    ) -> None:
        """Update the LLM setting ID for a session."""
        await Sessions.update_session_llm_setting_id(session_uuid, llm_setting_id)

    async def get_session_llm_setting_id(
        self, session_uuid: uuid.UUID
    ) -> Optional[str]:
        """Get the LLM setting ID for a session."""
        return await Sessions.get_session_llm_setting_id(session_uuid)

    async def get_session_events_with_details(self, session_id: str) -> List[dict]:
        events = await Events.get_session_events_with_details(session_id)

        # generate signed url for event contents with type file_url
        # read src/ii_agent/subscribers/database_subscriber.py for reference
        # TODO: define the explicit type instead of using dictionary
        updated_events = []
        for event in events:
            if event["type"] == EventType.TOOL_RESULT:
                tool_result = event["content"].get("result", {})
                if (
                    isinstance(tool_result, dict)
                    and tool_result.get("type") == "file_url"
                ):
                    updated_content = deepcopy(event["content"])
                    tool_result = updated_content["result"]
                    tool_result["url"] = self.file_store.get_download_signed_url(
                        path=tool_result["file_storage_path"]
                    )
                    updated_content["result"] = tool_result
                    event["content"] = updated_content

            updated_events.append(event)

        return updated_events