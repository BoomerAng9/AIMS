UPLOAD_FOLDER_NAME = "uploaded_files"
COMPLETE_MESSAGE = "Completed the task."
DEFAULT_MODEL = "claude-sonnet-4@20250514"

TOKEN_BUDGET = 120_000
SUMMARY_MAX_TOKENS = 8192
VISIT_WEB_PAGE_MAX_OUTPUT_LENGTH = 40_000
COMPRESSION_TOKEN_THRESHOLD = 0.7

# GPT-5 model constants
GPT5_BASE = "gpt-5"
GPT5_CODEX = "gpt-5-codex"


def is_gpt5_family(model_name: str) -> bool:
    """
    Check if a model belongs to the GPT-5 family.

    Args:
        model_name: The model name to check

    Returns:
        True if the model is in the GPT-5 family, False otherwise
    """
    if not model_name:
        return False

    # Check if model name contains "gpt-5" (case-insensitive)
    return "gpt-5" in model_name.lower()

def is_anthropic_family(model_name: str) -> bool:
    """
    Check if a model belongs to the Anthropic family.

    Args:
        model_name: The model name to check
    """
    return ("sonnet" in model_name.lower()) or ("opus" in model_name.lower())