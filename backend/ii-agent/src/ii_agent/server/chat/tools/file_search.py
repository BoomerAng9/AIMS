import json
import logging
import uuid
from datetime import datetime, timezone
from typing import List

from openai import AsyncOpenAI
from openai.types.shared_params.comparison_filter import ComparisonFilter
from openai.types.shared_params.compound_filter import CompoundFilter
from ii_agent.server.chat.models import ErrorTextContent, JsonResultContent
from ii_agent.server.llm_settings.service import get_system_llm_config

from .base import BaseTool, ToolInfo, ToolCallInput, ToolResponse

logger = logging.getLogger(__name__)


class FileSearchTool(BaseTool):
    """Execute Python code using OpenAI's Code Interpreter via Responses API."""

    def __init__(
        self,
        session_id: str,
        vector_store_id: str,
        user_id: str,
    ):
        self.llm_config = get_system_llm_config(model_id="default")
        self.vector_store_id = vector_store_id
        self.session_id = session_id
        self.user_id = user_id
        self._name = "file_search"

        # Initialize OpenAI client
        self.client = AsyncOpenAI(
            api_key=self.llm_config.api_key.get_secret_value(),
            base_url=self.llm_config.base_url if self.llm_config.base_url else None,
        )

    @property
    def name(self) -> str:
        return self._name

    def info(self) -> ToolInfo:
        return ToolInfo(
            name=self._name,
            description=(
                "Search through uploaded documents and files to find relevant information, "
                "extract specific details, or answer questions based on file contents. "
                "Uses semantic search to understand context and meaning.\n\n"
                "Supported file formats:\n"
                "- Documents: .pdf, .docx, .txt, .md, .rtf\n"
                "- Other: .tex, .pptx\n\n"
                "Use this for:\n"
                "- Finding specific information within documents\n"
                "- Answering questions about uploaded file contents\n"
                "- Extracting relevant passages or data points\n"
                "- Summarizing sections of documents\n"
                "- Comparing information across multiple files\n"
                "- Locating code snippets or functions\n"
                "- Cross-referencing details from different documents"
            ),
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": (
                            "A clear search query or question about the uploaded files. "
                            "Be specific about what information you're looking for. "
                            "Examples:\n"
                            "- 'What is the total revenue mentioned in the Q3 report?'\n"
                            "- 'Find all references to the authentication system'\n"
                            "- 'What are the key findings in the research paper?'\n"
                            "- 'List all API endpoints defined in the documentation'\n"
                            "- 'What does the contract say about termination clauses?'\n"
                            "- 'Find the implementation of the login function'\n"
                            "- 'Compare the pricing models mentioned in both documents'"
                        ),
                    },
                    "file_names": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": (
                            "Optional list of specific file names to search within. "
                            "Use this to narrow the search scope to particular files when you know "
                            "which documents contain the relevant information. "
                            "Examples:\n"
                            "- ['contract.pdf', 'amendment.pdf'] - Search in contract and its amendment\n"
                            "- ['api_docs.md'] - Search only in API documentation"
                        ),
                    },
                },
            },
            required=["query"],
        )

    def _build_filters(self, file_names: List[str] | None = None) -> CompoundFilter:
        """Build compound filters for the file search request."""
        time_cutoff = (
            datetime.now(timezone.utc).timestamp() - 24 * 60 * 60
        )  # last 24 hours

        logger.debug(
            f"Building filters with time_cutoff: {time_cutoff} (24h ago from {datetime.now(timezone.utc).timestamp()})"
        )

        filters: list[ComparisonFilter] = [
            {
                "type": "eq",
                "key": "session_id",
                "value": self.session_id,
            },
            {
                "type": "eq",
                "key": "user_id",
                "value": self.user_id,
            },
        ]
        # if file_names:
        #     filters.append(
        #         {
        #             "type": "in",
        #             "key": "file_name",
        #             "value": file_names,
        #         }
        #     )

        logger.debug(f"Filters built: {filters}")
        return {
            "type": "and",
            "filters": filters,
        }

    async def run(self, tool_call: ToolCallInput) -> ToolResponse:
        """Execute code using OpenAI Responses API with code interpreter."""
        try:
            params = json.loads(tool_call.input)
            query = params["query"]
            file_names = params.get("file_names")  # Optional parameter
        except (json.JSONDecodeError, KeyError) as e:
            return ToolResponse(
                output=ErrorTextContent(value=f"Invalid tool input: {e}")
            )

        try:
            # Get files from parent message
            filters = self._build_filters(file_names=file_names)
            response = await self.client.vector_stores.search(
                vector_store_id=self.vector_store_id,
                query=query,
                filters=filters,
                max_num_results=10,
                ranking_options={"ranker": "auto"},
            )
            search_results = response.data
            if isinstance(search_results, list):
                results = [m.model_dump() for m in search_results]
            else:
                results = search_results.model_dump()

            return ToolResponse(output=JsonResultContent(value=results))

        except Exception as e:
            logger.error(f"Code interpreter error: {e}", exc_info=True)
            return ToolResponse(
                output=ErrorTextContent(value=f"File search failed: {str(e)}")
            )
