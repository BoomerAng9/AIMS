from . import utils
from .base import BaseImageSearchClient, ImageSearchResult
from ii_tool.integrations.storage import BaseStorage



class ImageSearchService:
    def __init__(self, client: BaseImageSearchClient, storage: BaseStorage) -> None:
        self.client = client
        self.storage = storage

    async def search(self, query: str, aspect_ratio: str, image_type: str, min_width: int, min_height: int, is_product: bool, max_results: int) -> ImageSearchResult:
        client_results = await self.client.search(
            query=query,
            aspect_ratio=aspect_ratio,
            image_type=image_type,
            min_width=min_width,
            min_height=min_height,
            is_product=is_product,
        )

        results = []

        for result in client_results.result:
            if len(results) >= max_results:
                break

            url = result["image_url"]
            is_available, content_type = utils.is_image_url_available(url)
            if not is_available:
                continue

            extension = utils.convert_mimetype_to_extension(content_type)
            name = utils.generate_unique_image_name()
            blob_path = utils.construct_blob_path(f"{name}.{extension}")
            try:
                await self.storage.write_from_url(url, blob_path, content_type)
            # TODO: handle the true error case
            except Exception as e:
                print(f"Error writing image to storage: {e}")
                continue

            public_url = self.storage.get_public_url(blob_path)
            new_result = result.copy()
            new_result["image_url"] = public_url
            results.append(new_result)

        return ImageSearchResult(
            result=results,
            cost=client_results.cost,
        )