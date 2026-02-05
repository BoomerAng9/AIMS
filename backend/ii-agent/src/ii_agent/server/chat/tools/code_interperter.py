import json
import uuid
import logging
import io
from typing import List

import anyio
from openai import AsyncOpenAI
from openai.types.responses import (
    ResponseCodeInterpreterToolCall,
    ResponseOutputMessage,
)
from openai.types.responses.response_code_interpreter_tool_call import (
    OutputImage,
    OutputLogs,
)
from openai.types.responses.response_output_text import (
    ResponseOutputText,
    AnnotationContainerFileCitation,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ii_agent.server.chat.models import ErrorTextContent


from .base import BaseTool, ToolInfo, ToolCallInput, ToolResponse
from ii_agent.db.chat import ChatMessage
from ii_agent.db.models import FileUpload
from ii_agent.core.config.llm_config import LLMConfig
from ii_agent.storage import BaseStorage
from ii_agent.core.storage.locations import get_session_file_path

logger = logging.getLogger(__name__)


class CodeInterpreter(BaseTool):
    """Execute Python code using OpenAI's Code Interpreter via Responses API."""

    def __init__(
        self,
        llm_config: LLMConfig,
        db_session: AsyncSession,
        storage: BaseStorage,
        session_id: str,
        parent_message_id: uuid.UUID,
        user_id: str,
    ):
        self.llm_config = llm_config
        self.db_session = db_session
        self.storage = storage
        self.session_id = session_id
        self.parent_message_id = parent_message_id
        self.user_id = user_id
        self._name = "code_interpreter"

        # Initialize OpenAI client
        self.client = AsyncOpenAI(
            api_key=llm_config.api_key.get_secret_value(),
            base_url=llm_config.base_url if llm_config.base_url else None,
        )

    @property
    def name(self) -> str:
        return self._name

    def info(self) -> ToolInfo:
        return ToolInfo(
            name=self._name,
            description=(
                "Execute code to perform calculations, data analysis, create visualizations, "
                "or manipulate data. This tool can read uploaded files and generate output files.\n\n"
                "Supported input file formats:\n"
                "- Code: .c, .cpp, .csv, .docx, .html, .java, .json, .md, .pdf, .php, .pptx, .py, .rb, "
                ".tex, .txt, .css, .js, .sh, .ts\n"
                "- Data: .csv, .json, .xlsx, .xml\n"
                "- Images: .jpeg, .jpg, .gif, .png, .tar, .webp\n\n"
                "Use this for:\n"
                "- Mathematical computations and equation solving\n"
                "- Data analysis and statistics\n"
                "- Creating visualizations (charts, graphs, plots)\n"
                "- File format conversions\n"
                "- Text processing and parsing\n"
                "- Any task requiring code execution"
            ),
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": (
                            "A clear description of what you want to accomplish with code execution. "
                            "Examples:\n"
                            "- 'Solve the equation 3x + 11 = 14'\n"
                            "- 'Analyze the uploaded CSV file and show summary statistics'\n"
                            "- 'Create a bar chart from this data'\n"
                            "- 'Convert the uploaded JSON to CSV format'\n"
                            "- 'Extract text from the PDF file'\n"
                            "- 'Generate a scatter plot showing the correlation'"
                        ),
                    }
                },
            },
            required=["query"],
        )

    async def _get_parent_message_files(self) -> List[str]:
        """Get file IDs from the parent user message's file_ids column."""
        try:
            result = await self.db_session.execute(
                select(ChatMessage).where(ChatMessage.id == self.parent_message_id)
            )
            parent_message = result.scalar_one_or_none()

            if not parent_message:
                logger.warning(f"Parent message {self.parent_message_id} not found")
                return []

            # Get file IDs from the file_ids column
            if parent_message.file_ids:
                return [str(file_id) for file_id in parent_message.file_ids]

            return []

        except Exception as e:
            logger.error(f"Error getting parent message files: {e}", exc_info=True)
            return []

    async def _upload_files_to_openai(self, file_ids: List[str]) -> List[str]:
        """Download files from GCS and upload to OpenAI."""
        if not file_ids:
            return []

        openai_file_ids = []

        try:
            # Get all file info from database in a single query
            result = await self.db_session.execute(
                select(FileUpload).where(FileUpload.id.in_(file_ids))
            )
            file_uploads = result.scalars().all()

            if not file_uploads:
                logger.warning(f"No files found for IDs: {file_ids}")
                return []

            # Upload each file to OpenAI
            for file_upload in file_uploads:
                try:
                    # Download file from GCS (blocking I/O operation)
                    file_content = await anyio.to_thread.run_sync(
                        self.storage.read, file_upload.storage_path
                    )

                    # Upload to OpenAI
                    file_obj = await self.client.files.create(
                        file=(
                            file_upload.file_name,
                            file_content,
                            file_upload.content_type,
                        ),
                        purpose="assistants",
                    )
                    openai_file_ids.append(file_obj.id)
                    logger.info(
                        f"Uploaded file {file_upload.id} to OpenAI as {file_obj.id}"
                    )

                except Exception as e:
                    logger.error(
                        f"Error uploading file {file_upload.id} to OpenAI: {e}",
                        exc_info=True,
                    )

        except Exception as e:
            logger.error(f"Error fetching files from database: {e}", exc_info=True)

        return openai_file_ids

    def _get_file_extension_and_content_type(self, file_id: str) -> tuple[str, str]:
        """Determine file extension and content type from OpenAI file ID or default to common types."""
        # Common image formats
        if "png" in file_id.lower():
            return ".png", "image/png"
        elif "jpg" in file_id.lower() or "jpeg" in file_id.lower():
            return ".jpg", "image/jpeg"
        elif "gif" in file_id.lower():
            return ".gif", "image/gif"
        elif "webp" in file_id.lower():
            return ".webp", "image/webp"
        # Data formats
        elif "csv" in file_id.lower():
            return ".csv", "text/csv"
        elif "json" in file_id.lower():
            return ".json", "application/json"
        elif "xlsx" in file_id.lower():
            return (
                ".xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        elif "xml" in file_id.lower():
            return ".xml", "application/xml"
        # Default to PNG for images
        return ".png", "image/png"

    async def _download_files_from_openai(self, file_ids: List[str]) -> List[dict]:
        """Download generated files from OpenAI and upload to GCS.

        Supports all code interpreter output types:
        - Images: PNG, JPEG, GIF, WEBP
        - Data files: CSV, JSON, XLSX, XML, TXT, PDF

        Args:
            file_ids: List of OpenAI file IDs from annotations or outputs

        Returns:
            List of file metadata dicts with file_id, storage_path, url
        """
        output_files = []

        for openai_file_id in file_ids:
            try:
                # Download from OpenAI
                file_content_response = await self.client.files.content(openai_file_id)
                file_bytes = await anyio.to_thread.run_sync(file_content_response.read)

                # Determine file extension and content type
                ext, content_type = self._get_file_extension_and_content_type(
                    openai_file_id
                )

                # Create a file-like object
                file_obj = io.BytesIO(file_bytes)

                # Generate storage path
                file_name = f"code_output_{openai_file_id}{ext}"
                storage_path = get_session_file_path(
                    self.session_id, str(uuid.uuid4()), file_name
                )

                # Upload to GCS (blocking I/O operation)
                public_url = await anyio.to_thread.run_sync(
                    self.storage.upload_and_get_permanent_url,
                    file_obj,
                    storage_path,
                    content_type=content_type,
                )

                # Save to database
                db_file = FileUpload(
                    id=str(uuid.uuid4()),
                    user_id=self.user_id,
                    file_name=file_name,
                    file_size=len(file_bytes),
                    storage_path=storage_path,
                    content_type=content_type,
                    session_id=self.session_id,
                )
                self.db_session.add(db_file)
                await self.db_session.flush()

                output_files.append(
                    {
                        "file_id": db_file.id,
                        "openai_file_id": openai_file_id,
                        "storage_path": storage_path,
                        "url": public_url,
                        "file_name": file_name,
                        "content_type": content_type,
                    }
                )

                logger.info(
                    f"Downloaded and uploaded file {openai_file_id} to GCS at {storage_path}"
                )

            except Exception as e:
                logger.error(
                    f"Error downloading file {openai_file_id}: {e}", exc_info=True
                )

        return output_files

    async def run(self, tool_call: ToolCallInput) -> ToolResponse:
        """Execute code using OpenAI Responses API with code interpreter."""
        try:
            params = json.loads(tool_call.input)
            query = params["query"]
        except (json.JSONDecodeError, KeyError) as e:
            return ToolResponse(
                output=ErrorTextContent(value=f"Invalid tool input: {e}")
            )

        try:
            # Get files from parent message
            file_ids = await self._get_parent_message_files()
            openai_file_ids = []

            if file_ids:
                logger.info(f"Found {len(file_ids)} files in parent message")
                openai_file_ids = await self._upload_files_to_openai(file_ids)

            # Prepare code interpreter tool with file attachments in container
            container = {"type": "auto"}
            if openai_file_ids:
                container["file_ids"] = openai_file_ids

            tools = [{"type": "code_interpreter", "container": container}]

            # Build input message (files are attached via container, not input_items)
            input_items = [
                {
                    "type": "message",
                    "role": "user",
                    "content": [{"type": "input_text", "text": query}],
                }
            ]

            # Create response with code interpreter
            instructions = (
                "You are an expert code execution assistant using the Code Interpreter sandbox environment. "
                "Your role is to write and execute code to complete the requested task.\n\n"
                "## Responsibilities\n"
                "- Execute code to perform the requested analysis, computation, or transformation\n"
                "- Use only the provided input files; do not fetch external data\n"
                "- Save all output files to /mnt/data/ for download\n"
                "- Provide direct download links for all generated files\n"
                "- Make your response complete and self-contained\n\n"
                "## Workflow\n"
                "1. If input files are provided, examine their structure and content first\n"
                "2. Write clean, well-commented code to perform the task\n"
                "3. Handle errors gracefully and validate inputs\n"
                "4. If data is empty or insufficient, explain why the task cannot be completed\n"
                "5. Generate outputs (visualizations, data files, reports) as appropriate\n"
                "6. Save all outputs to /mnt/data/ with descriptive filenames\n\n"
                "## Output Requirements\n"
                "- List all generated files with download links in format: [filename](sandbox:/mnt/data/filename)\n"
                "- Provide clear summary of what was done and key findings\n"
                "- Use appropriate file formats: PNG/JPEG for images, CSV/JSON/XLSX for data, TXT/PDF for reports\n"
                "- If task cannot be completed, explain the reason clearly\n\n"
                "## Code Best Practices\n"
                "- Write idiomatic code in the appropriate language for the task\n"
                "- Include error handling and input validation\n"
                "- Add comments to explain non-obvious logic\n"
                "- Use descriptive variable and function names\n"
                "- For visualizations, use clear labels, legends, and titles\n"
            )

            response = await self.client.responses.create(
                model=self.llm_config.model,
                tools=tools,
                instructions=instructions,
                input=input_items,
            )

            # Extract output
            output_text = []
            output_files = []
            file_ids_to_download = []

            for item in response.output:
                if isinstance(item, ResponseOutputMessage):
                    # Extract text content and file annotations
                    for content_part in item.content:
                        if isinstance(content_part, ResponseOutputText):
                            output_text.append(content_part.text)

                            # Extract file IDs from annotations
                            for annotation in content_part.annotations:
                                if isinstance(
                                    annotation, AnnotationContainerFileCitation
                                ):
                                    file_ids_to_download.append(annotation.file_id)

                elif isinstance(item, ResponseCodeInterpreterToolCall):
                    # Extract code execution results
                    if item.code:
                        output_text.append(f"```\n{item.code}\n```")

                    # Extract outputs (logs or images)
                    if item.outputs:
                        for output in item.outputs:
                            if isinstance(output, OutputLogs):
                                output_text.append(f"\nOutput:\n{output.logs}")
                            elif isinstance(output, OutputImage):
                                file_ids_to_download.append(output.url)

            # Download any generated files from annotations or outputs
            if file_ids_to_download:
                generated_files = await self._download_files_from_openai(
                    file_ids_to_download
                )
                if generated_files:
                    output_files.extend(generated_files)

            # Build response content
            result = {
                "answer": "\n\n".join(output_text)
                if output_text
                else "Code executed successfully.",
                "files": output_files if output_files else [],
            }

            return ToolResponse(
                output=JsonResultContent(value=result),
                metadata=json.dumps(
                    {
                        "usage": {
                            "input_tokens": response.usage.input_tokens
                            if response.usage
                            else 0,
                            "output_tokens": response.usage.output_tokens
                            if response.usage
                            else 0,
                        }
                    }
                ),
            )

        except Exception as e:
            logger.error(f"Code interpreter error: {e}", exc_info=True)
            return ToolResponse(
                output=ErrorTextContent(value=f"Code execution failed: {str(e)}")
            )
