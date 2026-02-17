import unittest
import os
import asyncio
from pydantic import BaseModel
from typing import Optional

from card_box_core.api_client import LLMAdapter
from card_box_core.config import LLMAdapterSettings

# A simple Pydantic model for structured response
class LLMQuote(BaseModel):
    quote: str
    author: str

class TestLLMProviders(unittest.TestCase):

    @unittest.skipIf(not os.environ.get("OPENAI_API_KEY"), "OPENAI_API_KEY not set, skipping OpenAI test")
    def test_openai_completion(self):
        """Tests a simple completion call to OpenAI."""
        asyncio.run(self._async_test_openai_completion())

    async def _async_test_openai_completion(self):
        adapter = LLMAdapter()
        messages = [{"role": "user", "content": "Give me a famous quote about programming. Respond in the requested format."}]
        
        response = await adapter.get_completion(
            messages=messages,
            model="gpt-3.5-turbo",
            response_model=LLMQuote
        )
        
        self.assertIsInstance(response, LLMQuote)
        self.assertTrue(len(response.quote) > 5)
        self.assertTrue(len(response.author) > 2)
        print(f"\nOpenAI Response: {response.quote} - {response.author}")

    @unittest.skipIf(not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"), "GOOGLE_APPLICATION_CREDENTIALS not set, skipping Vertex AI test")
    @unittest.skipIf(not os.environ.get("VERTEX_PROJECT"), "VERTEX_PROJECT not set, skipping Vertex AI test")
    @unittest.skipIf(not os.environ.get("VERTEX_LOCATION"), "VERTEX_LOCATION not set, skipping Vertex AI test")
    def test_vertexai_completion(self):
        """Tests a simple completion call to Google Vertex AI."""
        asyncio.run(self._async_test_vertexai_completion())

    async def _async_test_vertexai_completion(self):
        config = LLMAdapterSettings(
            litellm_params={
                "vertex_project": os.environ.get("VERTEX_PROJECT"),
                "vertex_location": os.environ.get("VERTEX_LOCATION"),
            }
        )
        adapter = LLMAdapter(config=config)
        messages = [{"role": "user", "content": "Give me a famous quote about artificial intelligence. Respond in the requested format."}]
        
        response = await adapter.get_completion(
            messages=messages,
            model="vertex_ai/gemini-2.5-flash",
            response_model=LLMQuote
        )
        
        self.assertIsInstance(response, LLMQuote)
        self.assertTrue(len(response.quote) > 5)
        self.assertTrue(len(response.author) > 2)
        print(f"\nVertex AI Response: {response.quote} - {response.author}")

if __name__ == "__main__":
    unittest.main()
