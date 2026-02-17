import requests
import base64
from typing import Dict, Any, List
from urllib.parse import urlparse

from card_box_core.utils import read_file_uri, FileReadError

def file_uri_to_base64(api_request: Dict[str, Any]) -> Dict[str, Any]:
    """
    A modifier for `ContextEngine.to_api` that converts file URIs to base64 data URLs.
    """
    messages = api_request.get("messages", [])
    
    for message in messages:
        content = message.get("content")
        if not isinstance(content, list):
            continue

        for part in content:
            if part.get("type") == "file":
                file_info = part.get("file", {})
                file_id = file_info.get("file_id")
                content_type = file_info.get("format", "application/octet-stream")

                if isinstance(file_id, str) and (file_id.startswith("s3://") or file_id.startswith("http")):
                    try:
                        print(f"   -> Downloading and converting URI: {file_id[:70]}...")
                        file_data = read_file_uri(file_id)
                        encoded_file = base64.b64encode(file_data).decode("utf-8")
                        base64_data_url = f"data:{content_type};base64,{encoded_file}"
                        part["file"] = {"file_data": base64_data_url}
                    except FileReadError as e:
                        print(f"Warning: Failed to download from {file_id}. Error: {e}. Will keep URI.")

    return api_request
