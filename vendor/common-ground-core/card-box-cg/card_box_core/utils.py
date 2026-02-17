import os
from urllib.parse import urlparse
import boto3
from botocore.client import Config
from botocore import UNSIGNED
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Any, Dict
import httpx

class FileReadError(Exception):
    """Custom exception for file read failures from URIs."""
    pass

def read_file_uri(uri: str) -> bytes:
    """
    Reads the content of a file from an S3 or HTTP/S URI.

    Args:
        uri: The S3 or HTTP/S URI.

    Returns:
        The content of the file as bytes.

    Raises:
        FileReadError: If there is an error reading from the URI.
    """
    try:
        parsed_uri = urlparse(uri)

        if parsed_uri.scheme == "s3":
            boto_kwargs: Dict[str, Any] = {'config': Config(signature_version=UNSIGNED)}
            endpoint_url = os.getenv("AWS_ENDPOINT_URL_S3")
            if endpoint_url:
                boto_kwargs['endpoint_url'] = endpoint_url
            
            s3 = boto3.client('s3', **boto_kwargs)
            
            bucket_name = parsed_uri.netloc
            object_key = parsed_uri.path.lstrip('/')

            response = s3.get_object(Bucket=bucket_name, Key=object_key)
            return response['Body'].read()

        elif parsed_uri.scheme in ["http", "https"]:
            with httpx.Client() as client:
                response = client.get(uri)
                response.raise_for_status()
                return response.content
        
        else:
            raise ValueError(f"Unsupported URI scheme: {parsed_uri.scheme}")

    except (ClientError, NoCredentialsError, ValueError, httpx.HTTPError) as e:
        raise FileReadError(f"Failed to read from URI {uri}: {e}") from e
