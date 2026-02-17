from pydantic import BaseModel
from pydantic_settings import BaseSettings
from typing import Dict, Any, List, Optional
import collections.abc


# Define per-component configuration models.
class ApiClientSettings(BaseModel):
    timeout: int = 30
    retry_attempts: int = 3
    retry_wait_multiplier: float = 1.0
    retry_wait_min: int = 1
    retry_wait_max: int = 10

class LLMAdapterSettings(BaseModel):
    max_retries: int = 3
    litellm_params: Dict[str, Any] = {}


class InteractionsAPISettings(BaseModel):
    default_model: str = "gemini-2.5-flash"
    request_timeout: int = 60
    client_options: Dict[str, Any] = {}
    store: bool = False

class PostgresStorageAdapterSettings(BaseModel):
    dsn: str
    min_size: int = 1
    max_size: int = 10
    sync_task_retry_base_seconds: int = 60
    sync_task_retry_max_power: int = 8
    auto_bootstrap: bool = True

class PdfToTextStrategySettings(BaseModel):
    a2a_base_url: str = "http://localhost:9999"

# Main settings model with nested component settings.
class Settings(BaseSettings):
    """
    Manage configuration for the card_box_core library.
    """
    API_CLIENT: ApiClientSettings = ApiClientSettings()
    LLM_ADAPTER: LLMAdapterSettings = LLMAdapterSettings()
    INTERACTIONS_API: InteractionsAPISettings = InteractionsAPISettings()
    POSTGRES_STORAGE_ADAPTER: Optional[PostgresStorageAdapterSettings] = None
    PDF_TO_TEXT_STRATEGY: PdfToTextStrategySettings = PdfToTextStrategySettings()
    
    STORAGE_BACKEND: str = "postgres"
    DEFAULT_HISTORY_LEVEL: str = "full"
    LLM_BACKEND: str = "litellm"
    # Control noisy stdout prints inside core for demos/tests
    VERBOSE_LOGS: bool = True
    EXTERNAL_STORAGE_ALLOWED_URI_SCHEMES: List[str] = ["s3", "https"]

# Global settings instance.
settings = Settings()

def configure(config_overrides: Dict[str, Any]):
    """
    Allow callers to override default configuration at application startup.
    
    Args:
        config_overrides: A dictionary matching the `Settings` structure,
            used to override one or more configuration fields.
    """
    global settings
    
    def _deep_update(source: Dict, overrides: Dict):
        for key, value in overrides.items():
            if isinstance(value, collections.abc.Mapping) and key in source and isinstance(source[key], collections.abc.Mapping):
                source[key] = _deep_update(source[key], value)
            else:
                source[key] = value
        return source

    updated_data = settings.model_dump()
    _deep_update(updated_data, config_overrides)
    settings = Settings.model_validate(updated_data)
