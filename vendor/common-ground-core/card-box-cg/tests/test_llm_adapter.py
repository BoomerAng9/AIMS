import unittest
import asyncio
from unittest.mock import AsyncMock, patch

from pydantic import BaseModel, Field
from card_box_core.api_client import LLMAdapter

class User(BaseModel):
    name: str = Field(description="The user's name")
    age: int = Field(description="The user's age")

class TestLLMAdapter(unittest.TestCase):

    @patch('instructor.patch')
    def test_init_stores_max_retries(self, mock_instructor_patch):
        """
        Verify that LLMAdapter.__init__ stores max_retries correctly.
        """
        adapter = LLMAdapter(max_retries=5)
        self.assertEqual(adapter.max_retries, 5)

    def test_get_completion_successful(self):
        """
        Verify the basic successful call path of LLMAdapter.
        """
        asyncio.run(self._async_test_get_completion_successful())

    async def _async_test_get_completion_successful(self):
        # We patch instructor here to avoid it actually patching litellm
        with patch('instructor.patch') as mock_patch:
            # Create an async mock for the patched client
            mock_client = AsyncMock()
            mock_patch.return_value = mock_client

            adapter = LLMAdapter()

            # Set the return value for our mock client
            mock_response_instance = User(name="Test", age=25)
            mock_client.return_value = mock_response_instance

            messages = [{"role": "user", "content": "Extract user Test who is 25"}]
            model = "gpt-4-turbo"

            response = await adapter.get_completion(
                messages=messages,
                model=model,
                response_model=User
            )

            self.assertIsInstance(response, User)
            self.assertEqual(response.name, "Test")
            self.assertEqual(response.age, 25)

            mock_client.assert_called_once_with(
                model=model,
                messages=messages,
                response_model=User,
                max_retries=adapter.max_retries
            )

    def test_get_completion_without_response_model(self):
        """
        Verify that LLMAdapter returns raw response when response_model is omitted.
        """
        asyncio.run(self._async_test_get_completion_without_response_model())

    async def _async_test_get_completion_without_response_model(self):
        # We patch instructor here to avoid it actually patching litellm
        with patch('instructor.patch') as mock_patch:
            # Create an async mock for the patched client
            mock_client = AsyncMock()
            mock_patch.return_value = mock_client

            adapter = LLMAdapter()

            # Mock the raw response from litellm
            mock_raw_response = "raw string response"
            mock_client.return_value = mock_raw_response

            messages = [{"role": "user", "content": "Just give me a string"}]
            model = "gpt-3.5-turbo"

            response = await adapter.get_completion(
                messages=messages,
                model=model,
                response_model=None # Explicitly None
            )

            self.assertEqual(response, mock_raw_response)

            mock_client.assert_called_once_with(
                model=model,
                messages=messages,
                max_retries=adapter.max_retries
            )


if __name__ == "__main__":
    unittest.main()
