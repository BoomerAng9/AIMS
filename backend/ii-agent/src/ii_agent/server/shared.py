from dotenv import load_dotenv
from socketio import AsyncRedisManager
from ii_agent.core.config.ii_agent_config import config
from ii_agent.core.pubsub import create_session_manager
from ii_agent.core.storage.settings.file_settings_store import FileSettingsStore
from ii_agent.server.services.sandbox_service import SandboxService
from ii_agent.server.services.agent_service import AgentService
from ii_agent.server.services.session_service import SessionService
from ii_agent.server.services.file_service import FileService
from ii_agent.server.services.billing_service import BillingService
from ii_agent.storage import create_storage_client


load_dotenv()


storage = create_storage_client(
    config.storage_provider,
    config.file_upload_project_id,
    config.file_upload_bucket_name,
)

# Create service layer
sandbox_service = SandboxService(
    config=config,
)

agent_service = AgentService(config=config, file_store=storage)

file_service = FileService(
    storage=storage,
)

session_service = SessionService(
    agent_service=agent_service,
    sandbox_service=sandbox_service,
    file_store=storage,
    config=config,
)

session_manager: AsyncRedisManager | None = create_session_manager(config=config)

SettingsStoreImpl = FileSettingsStore

billing_service = BillingService(config=config)
