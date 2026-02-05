"""API endpoints for external service connectors."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from pydantic import BaseModel
from sqlalchemy import select
from itsdangerous import URLSafeSerializer

from ii_agent.core.config.ii_agent_config import config
from ii_agent.db.models import Connector, ConnectorTypeEnum
from ii_agent.server.api.deps import CurrentUser, DBSession
from ii_agent.storage.base import BaseStorage

logger = logging.getLogger(__name__)

router = APIRouter()

GOOGLE_DRIVE_SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
]


def _normalize_expiry(expiry: Optional[datetime]) -> Optional[datetime]:
    """Ensure datetime values include timezone info for comparisons."""
    if expiry is None:
        return None
    if expiry.tzinfo is None:
        return expiry.replace(tzinfo=timezone.utc)
    return expiry


class ConnectorAuthUrlResponse(BaseModel):
    """Response model for connector authentication URL."""

    auth_url: str
    state: str


class ConnectorCallbackRequest(BaseModel):
    """Request model for OAuth callback."""

    code: str
    state: str


class ConnectorStatusResponse(BaseModel):
    """Response model for connector status."""

    is_connected: bool
    connector_type: str
    metadata: Optional[dict] = None
    access_token: Optional[str] = None


class GoogleDriveFilePickRequest(BaseModel):
    """Request model for Google Drive file selection."""

    file_ids: list[str]


class GoogleDrivePickerConfigResponse(BaseModel):
    """Response model for Google Drive picker configuration."""

    is_connected: bool
    access_token: Optional[str] = None
    developer_key: Optional[str] = None
    app_id: Optional[str] = None


@router.get("/connectors/google-drive/auth-url", response_model=ConnectorAuthUrlResponse)
async def get_google_drive_auth_url(
    current_user: CurrentUser,
    frontend_url: Optional[str] = None,
) -> ConnectorAuthUrlResponse:
    """Generate Google Drive OAuth URL."""
    if not config.google_client_id or not config.google_client_secret:
        raise HTTPException(
            status_code=500,
            detail="Google Drive integration is not configured",
        )

    serializer = URLSafeSerializer(config.session_secret_key)
    state_data = {
        "user_id": current_user.id,
        "connector": "google_drive"
    }
    if frontend_url:
        state_data["frontend_url"] = frontend_url
    state = serializer.dumps(state_data)

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": config.google_client_id,
                "client_secret": config.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [config.google_redirect_uri],
            }
        },
        scopes=GOOGLE_DRIVE_SCOPES,
        redirect_uri=config.google_redirect_uri,
    )

    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=state,
        prompt="consent",
    )

    return ConnectorAuthUrlResponse(auth_url=authorization_url, state=state)


@router.post("/connectors/google-drive/callback")
async def google_drive_callback(
    request: ConnectorCallbackRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    """Handle Google Drive OAuth callback."""
    serializer = URLSafeSerializer(config.session_secret_key)
    try:
        state_data = serializer.loads(request.state)
        if state_data.get("user_id") != current_user.id:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
    except Exception as e:
        logger.error(f"State verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": config.google_client_id,
                "client_secret": config.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [config.google_redirect_uri],
            }
        },
        scopes=GOOGLE_DRIVE_SCOPES,
        redirect_uri=config.google_redirect_uri,
    )

    try:
        flow.fetch_token(code=request.code)
        credentials = flow.credentials

        user_info_service = build("oauth2", "v2", credentials=credentials)
        user_info = user_info_service.userinfo().get().execute()

        token_expiry = _normalize_expiry(credentials.expiry)

        result = await db.execute(
            select(Connector).where(
                Connector.user_id == current_user.id,
                Connector.connector_type == ConnectorTypeEnum.GOOGLE_DRIVE.value,
            )
        )
        existing_connector = result.scalar_one_or_none()

        metadata = {
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "scopes": GOOGLE_DRIVE_SCOPES,  # Store scopes used during authorization
        }

        if existing_connector:
            existing_connector.access_token = credentials.token
            existing_connector.refresh_token = credentials.refresh_token
            existing_connector.token_expiry = token_expiry
            existing_connector.connector_metadata = metadata
            existing_connector.updated_at = datetime.now(timezone.utc)
        else:
            new_connector = Connector(
                user_id=current_user.id,
                connector_type=ConnectorTypeEnum.GOOGLE_DRIVE.value,
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                token_expiry=token_expiry,
                connector_metadata=metadata,
            )
            db.add(new_connector)

        await db.commit()

        return {"success": True, "message": "Google Drive connected successfully"}
    except Exception as e:
        logger.error(f"Google Drive OAuth callback failed: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to connect Google Drive: {str(e)}",
        )


@router.get("/connectors/google-drive/status", response_model=ConnectorStatusResponse)
async def get_google_drive_status(
    db: DBSession,
    current_user: CurrentUser,
) -> ConnectorStatusResponse:
    """Check if user has connected Google Drive."""
    result = await db.execute(
        select(Connector).where(
            Connector.user_id == current_user.id,
            Connector.connector_type == ConnectorTypeEnum.GOOGLE_DRIVE.value,
        )
    )
    connector = result.scalar_one_or_none()

    if connector:
        normalized_expiry = _normalize_expiry(connector.token_expiry)

        credentials = Credentials(
            token=connector.access_token,
            refresh_token=connector.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=config.google_client_id,
            client_secret=config.google_client_secret,
            scopes=GOOGLE_DRIVE_SCOPES,
            expiry=normalized_expiry,
        )

        try:
            is_expired = credentials.expired
        except TypeError:
            is_expired = False

        if is_expired and credentials.refresh_token:
            from google.auth.transport.requests import Request

            credentials.refresh(Request())
            normalized_expiry = _normalize_expiry(credentials.expiry)
            credentials.expiry = normalized_expiry
            connector.access_token = credentials.token
            connector.token_expiry = normalized_expiry
            await db.commit()

        return ConnectorStatusResponse(
            is_connected=True,
            connector_type=ConnectorTypeEnum.GOOGLE_DRIVE.value,
            metadata=connector.connector_metadata,
            access_token=connector.access_token,
        )

    return ConnectorStatusResponse(
        is_connected=False,
        connector_type=ConnectorTypeEnum.GOOGLE_DRIVE.value,
    )


@router.get(
    "/connectors/google-drive/picker-config",
    response_model=GoogleDrivePickerConfigResponse,
)
async def get_google_drive_picker_config(
    db: DBSession,
    current_user: CurrentUser,
) -> GoogleDrivePickerConfigResponse:
    """Return configuration required to launch the Google Drive picker."""
    result = await db.execute(
        select(Connector).where(
            Connector.user_id == current_user.id,
            Connector.connector_type == ConnectorTypeEnum.GOOGLE_DRIVE.value,
        )
    )
    connector = result.scalar_one_or_none()

    developer_key = config.google_picker_developer_key or None
    app_id = config.google_client_id or None

    if not connector:
        return GoogleDrivePickerConfigResponse(
            is_connected=False,
            developer_key=developer_key,
            app_id=app_id,
        )

    from google.auth import _helpers
    from datetime import timedelta
    import requests as http_requests

    # Always refresh token to ensure it's valid for the picker
    if connector.refresh_token:
        try:
            token_response = http_requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": config.google_client_id,
                    "client_secret": config.google_client_secret,
                    "refresh_token": connector.refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            token_data = token_response.json()

            if "access_token" in token_data:
                new_expiry = _helpers.utcnow() + timedelta(
                    seconds=token_data.get("expires_in", 3600)
                )

                connector.access_token = token_data["access_token"]
                connector.token_expiry = new_expiry
                await db.commit()

                return GoogleDrivePickerConfigResponse(
                    is_connected=True,
                    access_token=connector.access_token,
                    developer_key=developer_key,
                    app_id=app_id,
                )
            else:
                logger.error("No access token in refresh response")
        except Exception as e:
            logger.error(f"Failed to refresh token for picker: {e}")

    # Fallback to existing token if refresh fails or no refresh token
    return GoogleDrivePickerConfigResponse(
        is_connected=True,
        access_token=connector.access_token,
        developer_key=developer_key,
        app_id=app_id,
    )


@router.post("/connectors/google-drive/files")
async def download_google_drive_files(
    request: GoogleDriveFilePickRequest,
    db: DBSession,
    current_user: CurrentUser,
    storage: BaseStorage = Depends(lambda: config.storage),
):
    """Download selected files from Google Drive."""
    result = await db.execute(
        select(Connector).where(
            Connector.user_id == current_user.id,
            Connector.connector_type == ConnectorTypeEnum.GOOGLE_DRIVE.value,
        )
    )
    connector = result.scalar_one_or_none()

    if not connector:
        raise HTTPException(
            status_code=400,
            detail="Google Drive is not connected",
        )

    from google.auth.transport.requests import Request
    from google.auth import _helpers
    import json
    import requests as http_requests

    # Manually refresh the token without using credentials.expired
    if connector.refresh_token:
        try:
            token_response = http_requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": config.google_client_id,
                    "client_secret": config.google_client_secret,
                    "refresh_token": connector.refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            token_data = token_response.json()

            if "access_token" in token_data:
                new_expiry = _helpers.utcnow() + timedelta(
                    seconds=token_data.get("expires_in", 3600)
                )

                credentials = Credentials(
                    token=token_data["access_token"],
                    refresh_token=connector.refresh_token,
                    token_uri="https://oauth2.googleapis.com/token",
                    client_id=config.google_client_id,
                    client_secret=config.google_client_secret,
                    scopes=GOOGLE_DRIVE_SCOPES,
                    expiry=new_expiry,
                )

                connector.access_token = token_data["access_token"]
                connector.token_expiry = new_expiry
                await db.commit()
            else:
                raise Exception("No access token in response")
        except Exception as e:
            logger.warning(f"Failed to refresh credentials: {e}")
            normalized_expiry = _normalize_expiry(connector.token_expiry)
            credentials = Credentials(
                token=connector.access_token,
                refresh_token=connector.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=config.google_client_id,
                client_secret=config.google_client_secret,
                scopes=GOOGLE_DRIVE_SCOPES,
                expiry=normalized_expiry,
            )
    else:
        normalized_expiry = _normalize_expiry(connector.token_expiry)
        credentials = Credentials(
            token=connector.access_token,
            refresh_token=connector.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=config.google_client_id,
            client_secret=config.google_client_secret,
            scopes=GOOGLE_DRIVE_SCOPES,
            expiry=normalized_expiry,
        )

    try:
        service = build("drive", "v3", credentials=credentials)
        downloaded_files = []

        def list_files_in_folder(folder_id: str) -> list:
            """Recursively list all files in a folder."""
            file_ids = []
            page_token = None

            while True:
                try:
                    results = service.files().list(
                        q=f"'{folder_id}' in parents and trashed=false",
                        fields="nextPageToken, files(id, name, mimeType)",
                        pageToken=page_token,
                        supportsAllDrives=True,
                        includeItemsFromAllDrives=True
                    ).execute()

                    items = results.get("files", [])
                    for item in items:
                        if item.get("mimeType") == "application/vnd.google-apps.folder":
                            # Recursively get files from subfolders
                            file_ids.extend(list_files_in_folder(item["id"]))
                        else:
                            file_ids.append(item["id"])

                    page_token = results.get("nextPageToken")
                    if not page_token:
                        break

                except Exception as e:
                    logger.error(f"Failed to list files in folder {folder_id}: {e}")
                    break

            return file_ids

        # Process each selected item (file or folder)
        folder_file_mapping = {}

        for file_id in request.file_ids:
            try:
                logger.info(f"Attempting to get metadata for file ID: {file_id}")
                file_metadata = (
                    service.files()
                    .get(fileId=file_id, fields="id,name,mimeType,size", supportsAllDrives=True)
                    .execute()
                )
                logger.info(f"File metadata retrieved: {file_metadata}")

                is_folder = file_metadata.get("mimeType") == "application/vnd.google-apps.folder"
                logger.info(f"File {file_metadata.get('name')} is_folder: {is_folder}")

                if is_folder:
                    logger.info(f"Listing files in folder: {file_metadata.get('name')}")
                    folder_file_ids = list_files_in_folder(file_id)
                    logger.info(f"Found {len(folder_file_ids)} files in folder")

                    # Store folder metadata and its files
                    folder_file_mapping[file_id] = {
                        "folder_name": file_metadata["name"],
                        "folder_id": file_id,
                        "file_ids": folder_file_ids,
                        "file_uploads": []
                    }
                else:
                    # Individual file (not in a folder)
                    folder_file_mapping[file_id] = {
                        "folder_name": None,
                        "folder_id": None,
                        "file_ids": [file_id],
                        "file_uploads": []
                    }

            except Exception as e:
                logger.error(f"Failed to get metadata for file {file_id}: {e}")
                continue

        # Download all files and track which folder they belong to
        from ii_agent.db.models import FileUpload
        import io

        for original_id, folder_info in folder_file_mapping.items():
            for file_id in folder_info["file_ids"]:
                try:
                    file_metadata = (
                        service.files()
                        .get(fileId=file_id, fields="id,name,mimeType,size", supportsAllDrives=True)
                        .execute()
                    )

                    request_obj = service.files().get_media(fileId=file_id, supportsAllDrives=True)

                    fh = io.BytesIO()
                    downloader = MediaIoBaseDownload(fh, request_obj)
                    done = False
                    while not done:
                        status, done = downloader.next_chunk()

                    storage_path = f"users/{current_user.id}/google-drive/{file_id}/{file_metadata['name']}"
                    fh.seek(0)
                    storage.write(fh, storage_path, file_metadata.get("mimeType"))
                    signed_url = storage.get_download_signed_url(storage_path)

                    file_upload = FileUpload(
                        user_id=current_user.id,
                        file_name=file_metadata["name"],
                        file_size=int(file_metadata.get("size", 0)),
                        storage_path=storage_path,
                        content_type=file_metadata.get("mimeType"),
                    )
                    db.add(file_upload)
                    await db.flush()

                    folder_info["file_uploads"].append(file_upload.id)

                except Exception as e:
                    logger.error(f"Failed to download file {file_id}: {e}")
                    continue

        # Build response - one item per folder/file
        for original_id, folder_info in folder_file_mapping.items():
            if not folder_info["file_uploads"]:
                continue

            if folder_info["folder_name"]:
                # This is a folder
                downloaded_files.append({
                    "id": ",".join(str(fid) for fid in folder_info["file_uploads"]),
                    "name": folder_info["folder_name"],
                    "size": 0,
                    "mime_type": "application/vnd.google-apps.folder",
                    "file_url": None,
                    "is_folder": True,
                    "file_ids": folder_info["file_uploads"],
                    "file_count": len(folder_info["file_uploads"])
                })
            else:
                # This is an individual file
                file_upload_id = folder_info["file_uploads"][0]
                result = await db.execute(
                    select(FileUpload).where(FileUpload.id == file_upload_id)
                )
                file_upload = result.scalar_one()

                downloaded_files.append({
                    "id": str(file_upload.id),
                    "name": file_upload.file_name,
                    "size": file_upload.file_size,
                    "mime_type": file_upload.content_type,
                    "file_url": storage.get_download_signed_url(file_upload.storage_path),
                    "is_folder": False,
                })

        await db.commit()

        return {"success": True, "files": downloaded_files}
    except Exception as e:
        logger.error(f"Failed to download files from Google Drive: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download files: {str(e)}",
        )


@router.delete("/connectors/google-drive")
async def disconnect_google_drive(
    db: DBSession,
    current_user: CurrentUser,
):
    """Disconnect Google Drive and revoke access token."""
    result = await db.execute(
        select(Connector).where(
            Connector.user_id == current_user.id,
            Connector.connector_type == ConnectorTypeEnum.GOOGLE_DRIVE.value,
        )
    )
    connector = result.scalar_one_or_none()

    if not connector:
        raise HTTPException(
            status_code=404,
            detail="Google Drive is not connected",
        )

    # Revoke the access token with Google before deleting from database
    if connector.access_token:
        try:
            import requests as http_requests

            revoke_response = http_requests.post(
                "https://oauth2.googleapis.com/revoke",
                params={"token": connector.access_token},
                headers={"content-type": "application/x-www-form-urlencoded"},
            )

            # Google returns 200 for successful revocation
            if revoke_response.status_code == 200:
                logger.info(f"Successfully revoked Google Drive token for user {current_user.id}")
            else:
                logger.warning(
                    f"Failed to revoke Google Drive token for user {current_user.id}: "
                    f"status={revoke_response.status_code}, response={revoke_response.text}"
                )
        except Exception as e:
            # Log the error but continue with disconnection
            # The token might already be invalid or revoked
            logger.error(f"Error revoking Google Drive token for user {current_user.id}: {e}")

    await db.delete(connector)
    await db.commit()

    return {"success": True, "message": "Google Drive disconnected successfully"}
