"""File storage API endpoints."""

import uuid
from typing import AsyncIterator
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, and_
from ii_agent.db.models import User, FileUpload, Session
from ii_agent.storage import BaseStorage, GCS
from ii_agent.core.config.ii_agent_config import config
from ii_agent.server.api.deps import DBSession, CurrentUser
from ii_agent.server.shared import storage as shared_storage
import anyio


router = APIRouter(tags=["files"])


# TODO: move this to deps.py file
async def get_file_upload_storage() -> BaseStorage:
    """Dependency to get storage provider instance."""
    if config.storage_provider == "gcs":
        return GCS(
            config.file_upload_project_id,
            config.file_upload_bucket_name,
            config.custom_domain,
        )

    raise HTTPException(status_code=500, detail="Storage provider not supported")


async def get_avatar_storage() -> BaseStorage:
    """Dependency to get avatar storage provider instance."""
    if config.storage_provider == "gcs":
        return GCS(
            config.avatar_project_id, config.avatar_bucket_name, config.custom_domain
        )

    raise HTTPException(status_code=500, detail="Storage provider not supported")


# TODO: move this to utils.py file
def _get_blob_name(user_id: str, file_id: str, file_name: str) -> str:
    return f"users/{user_id}/uploads/{file_id}-{file_name}"


# TODO: move this to schemas.py file
class GenerateUploadUrlRequest(BaseModel):
    file_name: str
    content_type: str
    file_size: int


class GenerateUploadUrlResponse(BaseModel):
    id: str
    upload_url: str


class UploadCompleteRequest(BaseModel):
    id: str
    file_name: str
    file_size: int
    content_type: str


class UploadCompleteResponse(BaseModel):
    file_url: str


# TODO: move this to services layer
@router.post("/chat/generate-upload-url")
async def generate_upload_url(
    upload_request: GenerateUploadUrlRequest,
    current_user: CurrentUser,
    storage: BaseStorage = Depends(get_file_upload_storage),
):
    """Generate a signed URL for uploading a file to the object storage."""

    user_id = current_user.id
    file_name = upload_request.file_name
    content_type = upload_request.content_type
    file_size = upload_request.file_size

    # File size validation using config
    if file_size > config.file_upload_size_limit:
        raise HTTPException(
            status_code=413,
            detail=f"File size {file_size} bytes exceeds maximum allowed size of {config.file_upload_size_limit} bytes",
        )

    file_id = str(uuid.uuid4())
    blob_name = _get_blob_name(user_id, file_id, file_name)

    # generate the signed URL
    signed_url = storage.get_upload_signed_url(blob_name, content_type)

    return GenerateUploadUrlResponse(
        id=file_id,
        upload_url=signed_url,
    )


@router.post("/chat/upload-complete")
async def upload_complete(
    upload_complete_request: UploadCompleteRequest,
    db: DBSession,
    current_user: CurrentUser,
    storage: BaseStorage = Depends(get_file_upload_storage),
):
    """Generate a signed URL for downloading a file from the object storage."""
    user_id = current_user.id
    file_id = upload_complete_request.id
    file_name = upload_complete_request.file_name
    file_size = upload_complete_request.file_size
    content_type = upload_complete_request.content_type

    blob_name = _get_blob_name(user_id, file_id, file_name)

    # Check if the file exists in storage
    if not storage.is_exists(blob_name):
        raise HTTPException(status_code=404, detail="File not found in storage")

    # create the file upload record
    file_upload_record = FileUpload(
        id=file_id,
        user_id=user_id,
        file_name=file_name,
        file_size=file_size,
        storage_path=blob_name,
        content_type=content_type,
    )
    db.add(file_upload_record)
    await db.commit()
    await db.refresh(file_upload_record)

    # Generate the signed download URL
    signed_url = storage.get_download_signed_url(blob_name)

    return UploadCompleteResponse(
        file_url=signed_url,
    )



@router.get("/chat/{session_id}/files/{file_id}")
async def download_file(
    session_id: str,
    file_id: str,
    db: DBSession,
    current_user: CurrentUser,
):
    """Download a file from a session with async streaming."""

    # Verify session belongs to user
    session_result = await db.execute(
        select(Session).where(
            and_(
                Session.id == session_id,
                Session.user_id == str(current_user.id)
            )
        )
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or access denied")

    # Get file upload record
    file_result = await db.execute(
        select(FileUpload).where(
            and_(
                FileUpload.id == file_id,
                FileUpload.session_id == session.id
            )
        )
    )
    file_upload = file_result.scalar_one_or_none()
    if not file_upload:
        raise HTTPException(status_code=404, detail="File not found in session")

    # Verify file exists in storage
    storage_path = file_upload.storage_path

    async def file_stream() -> AsyncIterator[bytes]:
        """Async generator to stream file content."""
        # Read file from storage in a thread to avoid blocking
        file_obj = await anyio.to_thread.run_sync(shared_storage.read, storage_path)

        try:
            # Stream in chunks (64KB chunks)
            chunk_size = 64 * 1024
            while True:
                chunk = await anyio.to_thread.run_sync(file_obj.read, chunk_size)
                if not chunk:
                    break
                yield chunk
        finally:
            # Close file handle
            await anyio.to_thread.run_sync(file_obj.close)

    return StreamingResponse(
        file_stream(),
        media_type=file_upload.content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{file_upload.file_name}"',
            "Content-Length": str(file_upload.file_size),
        }
    )

@router.post("/avatar")
async def upload_avatar(
    db: DBSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    storage: BaseStorage = Depends(get_avatar_storage),
):
    """Upload or update an avatar image for the user."""
    user_id = current_user.id
    file_extension = file.filename.split(".")[-1]
    destination_blob_name = f"users/{user_id}/profile/avatar.{file_extension}"

    storage.write(
        content=file.file,
        path=destination_blob_name,
    )

    # update the user's avatar
    current_user.avatar = destination_blob_name
    await db.commit()
    await db.refresh(current_user)

    return JSONResponse(
        status_code=200,
        content={
            "message": "Avatar uploaded successfully",
            "url": storage.get_public_url(destination_blob_name),
        },
    )


@router.get("/avatar")
async def get_avatar(
    current_user: CurrentUser,
    storage: BaseStorage = Depends(get_avatar_storage),
):
    """Get the avatar image for the user."""
    avatar_blob_name = current_user.avatar

    if not avatar_blob_name:
        raise HTTPException(status_code=404, detail="No avatar image found")

    return JSONResponse(
        status_code=200, content={"url": storage.get_public_url(avatar_blob_name)}
    )
