"""API key generation utilities."""

import secrets
import string


def generate_api_key(length: int = 32) -> str:
    """Generate a secure random API key.
    
    Args:
        length: Length of the API key (default 32 characters)
        
    Returns:
        A secure random API key string
    """
    # Use a combination of letters, digits for the API key
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_prefixed_api_key(prefix: str = "ii", length: int = 32) -> str:
    """Generate a prefixed API key for easy identification.
    
    Args:
        prefix: Prefix for the API key (default "ii")
        length: Total length of the API key including prefix and separator
        
    Returns:
        A prefixed API key in format: prefix_randomstring
    """
    # Account for prefix and underscore in total length
    remaining_length = max(8, length - len(prefix) - 1)
    random_part = generate_api_key(remaining_length)
    return f"{prefix}_{random_part}"