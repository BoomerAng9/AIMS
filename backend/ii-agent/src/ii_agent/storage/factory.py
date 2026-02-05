from ii_agent.storage import BaseStorage, GCS


def create_storage_client(
    storage_provider: str,
    project_id: str,
    bucket_name: str,
    custom_domain: str | None = None,
) -> BaseStorage:
    if storage_provider == "gcs":
        return GCS(
            project_id,
            bucket_name,
            custom_domain,
        )
    raise ValueError(f"Storage provider {storage_provider} not supported")
