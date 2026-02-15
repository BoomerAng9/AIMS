import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from ii_agent.db.models import User
from ii_agent.server.api.deps import get_db, get_current_user
from fastapi import FastAPI
from ii_agent.server.branding.routes import branding_router
import io

@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = "test-user-id"
    user.role = "user"
    return user

@pytest.fixture
def test_app(mock_user):
    app = FastAPI()
    app.include_router(branding_router)
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: mock_user
    return app

@pytest.fixture
def client(test_app):
    return TestClient(test_app)

def test_upload_logo_success(client, mock_user):
    # Mock config.storage
    with patch("ii_agent.server.branding.routes.config") as mock_config:
        mock_storage = MagicMock()
        mock_config.storage = mock_storage
        mock_storage.upload_and_get_permanent_url.return_value = "http://example.com/logo.png"

        # Mock BrandingService
        with patch("ii_agent.server.branding.routes.BrandingService") as MockService:
            mock_service_instance = MockService.return_value
            mock_service_instance.upload_logo.return_value = MagicMock()

            file_content = b"fake image content"
            files = {"file": ("logo.png", file_content, "image/png")}

            response = client.post("/branding/logo", files=files)

            assert response.status_code == 200
            mock_storage.upload_and_get_permanent_url.assert_called_once()

            # Verify the call to upload_logo
            args, kwargs = mock_service_instance.upload_logo.call_args
            assert kwargs["file_url"] == "http://example.com/logo.png"
            assert kwargs["dark_mode"] is False
            assert kwargs["user_id"] == "test-user-id"
            assert kwargs["is_admin"] is False

def test_upload_logo_too_large(client, mock_user):
    file_content = b"a" * (6 * 1024 * 1024)  # 6MB
    files = {"file": ("logo.png", file_content, "image/png")}

    response = client.post("/branding/logo", files=files)

    assert response.status_code == 400
    assert "File too large" in response.json()["detail"]

def test_upload_logo_invalid_type(client, mock_user):
    file_content = b"fake content"
    files = {"file": ("test.txt", file_content, "text/plain")}

    response = client.post("/branding/logo", files=files)

    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]
