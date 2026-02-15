import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
from tenacity import RetryError
from ii_tool.mcp.server import check_tool_server_health

@pytest.mark.asyncio
async def test_check_tool_server_health_success():
    """Test that check_tool_server_health succeeds when the server is healthy."""
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock() # Sync method
        mock_get.return_value = mock_response

        await check_tool_server_health("http://localhost:8000")

        assert mock_get.call_count == 1

@pytest.mark.asyncio
async def test_check_tool_server_health_retry_success():
    """Test that check_tool_server_health retries and eventually succeeds."""
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        # First call raises an exception, second call succeeds
        mock_response_success = AsyncMock()
        mock_response_success.status_code = 200
        mock_response_success.raise_for_status = MagicMock()

        mock_get.side_effect = [httpx.RequestError("Connection failed"), mock_response_success]

        await check_tool_server_health("http://localhost:8000")

        assert mock_get.call_count == 2

@pytest.mark.asyncio
async def test_check_tool_server_health_retry_failure():
    """Test that check_tool_server_health retries max times and fails."""
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.RequestError("Connection failed")

        # Since reraise=True, we expect the original exception
        with pytest.raises(httpx.RequestError):
            await check_tool_server_health("http://localhost:8000")

        # It should retry 5 times (stop_after_attempt(5))
        assert mock_get.call_count == 5
