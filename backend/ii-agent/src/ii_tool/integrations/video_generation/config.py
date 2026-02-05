from pydantic_settings import BaseSettings


class VideoGenerateConfig(BaseSettings):
    gcp_project_id: str | None = None
    gcp_location: str | None = None
    gcs_output_bucket: str | None = None
    google_ai_studio_api_key: str | None = None

    class Config:
        env_prefix = "VIDEO_GENERATE_"
        env_file = ".env"
        extra = "ignore"