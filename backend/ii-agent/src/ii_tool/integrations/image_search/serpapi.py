import urllib
import aiohttp

from typing import Any, List, Dict
from .base import BaseImageSearchClient, ImageSearchResult, ImageSearchError


IMGAR_MAP = {
    "square": "s",
    "tall": "t",
    "wide": "w",
    "panoramic": "xw",
}


class SerpAPIImageSearchClient(BaseImageSearchClient):
    """SerpAPI implementation of image search client."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://serpapi.com/search.json"

    async def search(self, query: str, aspect_ratio: str, image_type: str, min_width: int = 0, min_height: int = 0, is_product: bool = False, **kwargs: Any) -> ImageSearchResult:
        params = {
            "q": query,
            "api_key": self.api_key,
            "engine": "google_images",
        }
        if aspect_ratio != "all":
            params["imgar"] = IMGAR_MAP[aspect_ratio]
        if image_type != "all":
            params["image_type"] = image_type
        
        encoded_url = f"{self.base_url}?{urllib.parse.urlencode(params)}"

        async with aiohttp.ClientSession() as session:
            async with session.get(encoded_url) as response:
                if response.status != 200:
                    raise ImageSearchError(
                        f"SerpAPI request failed: {response.status} {response.reason}"
                    )

                data = await response.json()
        
        results = data.get("images_results", [])

        search_response = []
        for result in results:
            if int(result["original_width"]) < min_width or int(result["original_height"]) < min_height or result["is_product"] != is_product:
                continue
            
            search_response.append({
                "title": result["title"],
                "source": result["source"],
                "image_url": result["original"],
                "width": result["original_width"],
                "height": result["original_height"],
                "is_product": result["is_product"],
            })

        return ImageSearchResult(
            result=search_response,
            cost=275 / 30_000, # $275 per month ~ 30,000 queries with BIG DATA: https://serpapi.com/pricing
        )