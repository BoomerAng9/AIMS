import json
from typing import Any, Dict, List, TypedDict

import openai

from .base import Compressor


class LLMCompressor(Compressor):

    def __init__(self, llm_config: Dict[str, Any]):
        self._llm_config = llm_config

    async def acompress(self, chunks: List[str], title: str, query: str) -> List[int]:
        numbered_chunks = " ".join([f"<#{i+1}#> {chunk}" for i, chunk in enumerate(chunks)
                                   ])  # +1 because numbered_chunks is 1-indexed
        related = (await self._extract_relevant_segments(
            passage=self.Passage(text=numbered_chunks, query=query),
        ))
        return [num - 1 for num in self.parse_segment_numbers(related) if num >= 1
               ]  # -1 because numbered_chunks is 1-indexed


    def parse_segment_numbers(self, segment_list: str) -> List[int]:
        """
        Parse a string of segment numbers in format like "4-6,8-9" into a list of integers.

        Args:
            segment_list (str): String containing segment numbers and ranges, sorted by decreasing relevance

        Returns:
            List[int]: List of segment numbers, sorted by decreasing relevance
        """
        if segment_list.strip() == "":
            return []

        seen = set()
        result = []

        # Split by comma to handle multiple ranges
        for part in segment_list.split(","):
            if "-" in part:
                # Handle range (e.g., "4-6")
                start, end = map(int, part.split("-"))
                for num in range(start, end + 1):
                    if num not in seen:
                        seen.add(num)
                        result.append(num)
            else:
                # Handle single number
                num = int(part)
                if num not in seen:
                    seen.add(num)
                    result.append(num)

        return result  # Already in order of relevance

    class Passage(TypedDict):
        text: str
        query: str


    async def _extract_relevant_segments(self, passage: Passage) -> str:
        """
        Extract relevant segment numbers from a passage based on a query.
        
        Args:
            passage: A dictionary containing 'text' and 'query' fields
            
        Returns:
            A dictionary with a 'segment_list' field containing comma-separated segment numbers or ranges
        """
        # Create client with built-in retry logic
        client = openai.AsyncOpenAI(
            base_url=self._llm_config.get("base_url", "https://api.openai.com/v1"),
            api_key=self._llm_config.get("api_key"),
            max_retries=2,  # Configure retry attempts
            timeout=30.0,  # Request timeout in seconds
        )

        prompt = f"""You are an AI assistant specialized in analyzing text passages and extracting relevant segment numbers based on queries.
        Given a PASSAGE containing segments numbered as <#1#>, <#2#>, <#3#>, etc., and a QUERY,
        your task is to extract ONLY the segment numbers from the PASSAGE that are RELEVANT to the QUERY or USEFUL for the process of compressing the text.
        Guidelines:
        1. Analyze each segment carefully for relevance to the query
        2. Include only segments that directly answer or relate to the query, or are USEFUL for the process of compressing the text
        3. Present the segments in a comma-separated format, using ranges when appropriate
        4. Use hyphens to indicate ranges (e.g. "1-3" for segments 1, 2, and 3)
        5. Sort the segments by decreasing relevance
        6. If no segments are relevant, return an empty string
        7. If the passage contains code, return the full code section to the end of the code block
        8. Note that redundant are preferred over wrong ignoring

        PASSAGE:
        {passage['text']}
        
        QUERY:
        {passage['query']}
        
        Respond with just a comma-separated json list of segment numbers or ranges (e.g. "1,3,5-7").
            {{
            "segment_list": "1,3,5-7"
        }}
        """

        response = await client.chat.completions.create(model=self._llm_config.get("model", "gpt-4o"),
                                                        messages=[{
                                                            "role": "user",
                                                            "content": prompt
                                                        }],
                                                        temperature=0.0,
                                                        response_format={"type": "json_object"})
        if response.choices[0].message.content is None:
            return ""

        try:
            segment_list = json.loads(response.choices[0].message.content.strip())
        except json.JSONDecodeError as e:
            print(f"LLM Compressor Error: {e}")
            return ""

        print("Returning segment list: ", segment_list["segment_list"])

        return segment_list["segment_list"]