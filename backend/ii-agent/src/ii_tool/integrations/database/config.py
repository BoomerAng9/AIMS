from pydantic_settings import BaseSettings


class DatabaseConfig(BaseSettings):
    neon_db_api_key: str | None = None

    class Config:
        env_prefix = "DATABASE_"
        env_file = ".env"
        extra = "ignore"