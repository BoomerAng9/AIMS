import asyncio
import copy
import json
import logging
import re
from enum import Enum
from pydantic import BaseModel, SecretStr
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from ii_agent.core.event import EventType, RealtimeEvent
from ii_agent.core.event_stream import EventStream
from ii_agent.llm.base import (
    LLMClient,
    TextPrompt,
    TextResult,
    ThinkingBlock,
    ToolCall,
    ToolFormattedResult,
    ToolResult,
)

from ii_agent.controller.state import State
from ii_agent.metrics.models import TokenUsage


class ReportConfig(BaseModel):
    def generate_introduction_messages(self, query: str, skip_dash=False) -> str:
        return f"""
# Role and Objective
Prepare a detailed introduction for a report on the topic `{query}`, utilizing the provided information and the researcher's insights.
This is a real report that will be published an read widely, you must now make any mistake or include draft thoughts
# Instructions
- Compose a succinct, well-structured, and informative introduction in markdown, beginning with an H1 heading that offers a comprehensive report title.
- Restrict output to the introduction only; omit other sections, headers, or footers.
- Integrate LaTeX math syntax for equations as follows:
- Display equations: wrap with double dollar signs (`$$ ... $$`).
- Inline math: wrap with single dollar signs (`$ ... $`).
{"The table might have broken format, it's your job to correct it" if skip_dash else "- Construct markdown tables with headers that use exactly 3 dashes (`---`) as column separators. Do not exceed 3 dashes per header cell."}
- For in-text citations, apply APA format with markdown hyperlinks placed contextually. Example: ([Author, Year](url)). Substitute with actual citation and URL when available.
- Use the language matching the main topic.
- Assume the current date is `{datetime.now(timezone.utc).strftime("%B %d, %Y")}` if needed.
# Context
- Use information from previous messages and researcher input for the introduction.
- Output will be incorporated into a larger report; only provide the introduction section.
# Output Format
- Markdown with an H1 heading as the title, followed by the introduction prose.
- Correct LaTeX, tables, and citations as per guidelines.
# Verbosity
- Write concisely and clearly in a professional tone.
# Stop Conditions
- Only the introduction is produced—do not generate further sections or content beyond directives.
- Do not repeat headers, footers, or include placeholder sections.
- Do not add ``` tag in your response, the report will be viewed by a markdown viewer
# Reasoning Effort
Set reasoning_effort = minimal; prioritize clarity and accuracy for this single, focused introduction task.

DO NOT INCLUDE ANY OTHER TEXT OTHER THAN THE CONTENT OF THE REPORT IN YOUR ANSWER
"""

    def generate_subtopics_messages(self, query: str, introduction: str) -> str:
        return f"""
You are provided with a research draft from a world-renowned researcher, including sources, thought process, and a final research report. Your task is to organize this draft into clear subtopics for use in a comprehensive report.
This is a real report that will be published an read widely, you must now make any mistake or include draft thoughts

Inputs available:
- The introduction: {introduction}
- The main topic: {query}

Instructions:
- Generate a comma-separated list of 2 to 7 logically ordered and distinct subtopics. These subtopics will serve as the main headers in the final report.
- Ensure every subtopic is directly relevant to the provided main topic and research data. Do not include duplicate subtopics.
- Use the same language as the main topic for all subtopics.
- Include 'Introduction' and 'Conclusion' only if contextually appropriate.
- Do not add ``` tag in your response, the report will be viewed by a markdown viewer

After generating the subtopic string, briefly validate in 1-2 lines that all resulting subtopics are directly tied to the provided topic and no duplicates or irrelevant items are present. Proceed or self-correct if validation fails.

Output format:
Provide the subtopics as a single string, separated by commas (e.g., "Introduction, Subtopic 1, Subtopic 2, Conclusion"). Do not include any additional explanation or formatting.
"""

    def generate_subtopic_report_messages(
        self,
        content_from_previous_subtopics: str,
        subtopics: List[str],
        current_subtopic: str,
        query: str,
        skip_dash=False,
    ) -> str:
        return f"""

Prepare a detailed, well-structured report focusing exclusively on the assigned subtopic: {current_subtopic}, as part of the overarching main topic: {query} and its subtopics: {subtopics}. Ensure your report strictly covers the given subtopic without overlapping with content from previous subtopics or existing written sections.


**Inputs Provided:**
- `content_from_previous_subtopics` (string): All Markdown content already completed for previous subtopics.
- `subtopics` (array): Array of all subtopics for the report.
- `query` (string): The main research question/topic.
- `current_subtopic` (string): The subtopic you are to address in this task.

**Content Construction Guidelines:**
- Compose a comprehensive and deeply informative analysis specific to the assigned subtopic. Include factual data, quantitative details, and weighted reasoning based on the researcher's evaluation and interpretation where relevant.
- Format all text in Markdown. Begin with an H2 (##) header for the subtopic, and use H3 (###) for any secondary sections. Do not use H1 (single #) headers.
- Express numbers, equations, and formulas using LaTeX, enclosing display equations with double dollar signs (`$$...$$`) and inline math with single dollar signs (`$...$`). Do not use LaTeX environments (such as \begin or \end).
{"The table might have broken format, it's your job to correct it" if skip_dash else "- Construct markdown tables with headers that use exactly 3 dashes (`---`) as column separators. Do not exceed 3 dashes per header cell."}
- Insert all in-text citations in APA format using markdown hyperlinks (e.g., (Author, year](url))). 
- Use the main language of the topic/subtopic only.

**Content Coordination Instructions:**
- Review all prior content from `content_from_previous_subtopics`. Do not duplicate headers, sections, or information already covered. If a section must relate to prior content, clearly differentiate and specify its unique focus.
- If any required input (`content_from_previous_subtopics`, `subtopics`, `query`, `current_subtopic`) is missing or empty, return a markdown error block indicating which input is missing.
- If your analysis would result in a section already present in prior content (based on string or semantic similarity), do not repeat it; instead, further analyze and refer to the previous session

This is a real report that will be published an read widely, you must now make any mistake or include draft thoughts
DO NOT INCLUDE ANY OTHER TEXT OTHER THAN THE CONTENT OF THE REPORT IN YOUR ANSWER
- Do not add ``` tag in your response, the report will be viewed by a markdown viewer

**Output Format:**
- Submit your report as markdown, using:
    - H2 (##) for the main subtopic heading.
    - H3 (###) for all subsections.
    - Markdown tables with headers using 3-dash separators.
    - APA-style in-text citations as markdown links.
- Do not include any introductory, summary, or reference list sections.

**Sample Placeholders:**
- {subtopics}: e.g., ["Subtopic 1", "Subtopic 2"]
- {query}: e.g., What are the effects of X on Y?
- {current_subtopic}: e.g., Mechanisms of Action
- {content_from_previous_subtopics}: Markdown-formatted content from previous subtopics
"""

    def get_generate_report_system_prompt(self) -> str:
        return """
Developer: You have received a research draft from a world-renowned researcher that includes sources, cited ideas, and potentially an incomplete final research report. Your assignment is to transform this draft into a comprehensive, markdown-formatted report that answers the following question:

{question}

As an advanced AI document structuring assistant, proceed with the following workflow:


Guidelines:
- Stay focused on the question.
- Organize the report logically: title, introduction, main body, and conclusion/synthesis.
- Use only relevant information from the draft and aim for a minimum of 1000 words.
- Draw concrete conclusions strictly based on the provided data.
- Format the report in markdown, applying APA style for both in-text citations and references.
- Retain the language style of the main topic.
- Present mathematical expressions using LaTeX syntax ($$ for display; $ for inline).
- Include exactly one well-formatted markdown table according to the 3-dash rule.
- Place APA in-text citations as markdown hyperlinks at the end of cited content (e.g., ([Author, Year](url))).
- Add a reference list at the end, in APA style, listing complete entries with hyperlinks and ordering by first appearance.
- Identify and highlight in the report any missing data, incomplete references, or unmet requirements (such as a table, references, or minimum word count) and adapt your content accordingly.
- If needed data is absent for a full report, explicitly explain the limitation, follow the required report structure, and use available information only.
- Do not add ``` tag in your response, the report will be viewed by a markdown viewer

Default to plain text unless markdown is specifically required; in this task, use markdown formatting and adhere to its conventions for sections, headings, code, and tables. For equations, use LaTeX as specified.

After structuring the report, perform a brief validation in 1-2 lines: confirm that all sections are included, word count is sufficient, references are formatted correctly, and highlight any limitations encountered.

Do not include meta-comments or personal remarks outside the report.

# Output Structure

Your output must strictly follow this order:
- Title
- Introduction
- Main Content (comprehensive analysis, critical evaluation, one table, key findings, limitations)
- Conclusion/Synthesis
- References list (APA style, with valid hyperlinks)
- Validation summary (1-2 lines)

If metadata (e.g., URLs or dates) or table data is missing, flag this in the main report and explain in the validation. Prioritize recent, credible sources. Keep all output as markdown except for LaTeX math syntax inside appropriate delimeters. If the minimum word count cannot be achieved, note this and provide the most thorough analysis feasible given available information.
"""

    def generate_references_messages(self) -> str:
        return """
Given a report from a world-renowned researcher (with sources and main content), your objective is to extract all unique URLs cited in the main content and format corresponding references in APA style using markdown hyperlinks.
For each unique URL, include as much of the following information as available: author, publication date, title, website name, and the exact URL. Omit any fields that are missing, and do not invent any information. Only include URLs actually cited in the main content, avoiding duplicates and excluding non-URL sources. Maintain the reference language to match the section of the report where the reference appears. For incomplete or malformed URLs, include the citation using only available information.
List references in the order of their appearance in the report. Each reference should be on a new line, formatted in markdown:
- Author. (Year). Title. *Website Name*. [URL](actual_url)
If a field (Author, Year, Title, Website Name) is missing, omit it and retain the rest. Output only the final markdown-formatted reference list, without introductory text or additional information.
After extracting and formatting the references, review the list to ensure no duplicate URLs appear and that all available citation details are included as per the provided rules.
- Do not add ``` tag in your response, the report will be viewed by a markdown viewer
"""


class ReportType(Enum):
    BASIC = "basic"
    ADVANCED = "advanced"


class Subtopics(BaseModel):
    subtopics: List[str]


class ReportBuilder:
    def __init__(
        self,
        client: LLMClient,
        event_stream: EventStream,
        session_id: Optional[UUID] = None,
        run_id: Optional[UUID] = None,
    ):
        self.client = client
        self.config = ReportConfig()
        self.event_stream = event_stream
        self.session_id = session_id
        self.run_id = run_id

    def _get_session_id(self) -> Optional[UUID]:
        """Return session_id UUID if available."""
        return self.session_id

    def _get_run_id(self) -> Optional[UUID]:
        """Return run_id UUID if available."""
        return self.run_id

    def clean_response(self, text: str) -> str:
        """Clean up excessive dashes and spaces from Gemini responses."""
        if not text:
            return text

        # Remove sequences of 20+ dashes
        text = re.sub(r"-{30,}", "", text)

        # Remove sequences of 20+ spaces (but preserve newlines)
        text = re.sub(r"[ ]{30,}", " ", text)

        # # Clean up any resulting multiple blank lines (keep max 2)
        # text = re.sub(r'\n{3,}', '\n\n', text)

        return text.strip()

    def extract_valid_urls_from_state(self, state: State) -> List[str]:
        """Extract all valid URLs from the state's tool outputs."""
        urls = set()
        url_pattern = r'https?://[^\s\)\]\>"]+(?=[\s\)\]\>"]*(?:\s|$|[\)\]\>"]))'

        messages = state.get_messages_for_llm()
        for message_list in messages:
            for message in message_list:
                # Check tool outputs for URLs
                if (
                    isinstance(message, ToolFormattedResult)
                    or isinstance(message, ToolResult)
                ) and message.tool_output:
                    output_str = str(message.tool_output)
                elif isinstance(message, TextResult) and message.text:
                    output_str = message.text
                elif isinstance(message, ThinkingBlock) and message.thinking:
                    output_str = message.thinking
                elif isinstance(message, ToolCall) and message.tool_input:
                    output_str = str(message.tool_input)
                else:
                    continue
                found_urls = re.findall(url_pattern, output_str, re.IGNORECASE)
                for url in found_urls:
                    # Clean up URL (remove trailing punctuation)
                    cleaned_url = re.sub(r'[.,;!?\'")\]]+$', "", url)
                    if cleaned_url.startswith(("http://", "https://")):
                        urls.add(cleaned_url)

        return sorted(list(urls))

    def create_reference_constraint_prompt(self, valid_urls: List[str]) -> str:
        """Create a prompt constraint that limits references to valid URLs only."""
        if not valid_urls:
            return "\n\nIMPORTANT: No valid reference URLs were found in the research data. Do not include any external URL references in your report."

        urls_text = "\n".join([f"- {url}" for url in valid_urls])
        return f"""
Developer: # Reference Usage Policy

## Role and Objective
Ensure that only verified and approved sources are referenced in generated content, strictly adhering to the specified list.

## Instructions
- **Checklist: Before generating content:**
    1. Review the provided list of approved URLs: `{urls_text}`
    2. Confirm all needed references are present in the list
    3. Ensure no new, invented, or altered URLs are introduced
    4. Use only exact matches for citation
    5. If no suitable reference exists, omit citation, and proceed
- **Approved URLs Only:** Use exclusively the exact URLs provided in `{urls_text}` for all citations.
- **Strict Prohibition:** Never create, adjust, or reference URLs outside the provided list.
- **Citation Match Requirement:** Every referenced URL must match one in the list verbatim, with no changes.
- **No Suitable Reference:** When no appropriate reference is available, omit the citation, and do not create a substitute or placeholder.

## Output Format
All references must use the exact URL from the provided list without any alterations, abbreviations, or additions.

## Escalation and Validation
- If none of the URLs in the list are suitable for a reference, omit the citation, and proceed without it.
- Under no circumstances should a fabricated or altered URL be included.
"""

    async def build(
        self,
        query: str,
        state: State,
        report_type: ReportType = ReportType.BASIC,
        skip_dash=False,
    ) -> str:
        if report_type == ReportType.BASIC:
            return await self.generate_report_stream(query, state)
        elif report_type == ReportType.ADVANCED:
            return await self.generate_advance_report_stream(query, state, skip_dash)
        else:
            raise ValueError(f"Invalid report type: {report_type}")

    async def generate_report_stream(self, query: str, state: State) -> str:
        """Generate a streaming report using the OpenAI API."""

        try:
            messages = copy.deepcopy(state.get_messages_for_llm())

            # Extract valid URLs and add reference constraint
            valid_urls = self.extract_valid_urls_from_state(state)
            reference_constraint = self.create_reference_constraint_prompt(valid_urls)

            generate_instruction = (
                self.config.get_generate_report_system_prompt().format(question=query)
                + reference_constraint
            )
            messages.append([TextPrompt(text=generate_instruction)])
            contents, metrics = await self.client.agenerate(
                messages=messages,
                max_tokens=8192,
                tool_choice={"type": "none"},
                system_prompt=generate_instruction,
            )
            token_usage = TokenUsage.from_raw_metrics(
                metrics, self.client.application_model_name
            )
            await self.event_stream.publish(
                RealtimeEvent(
                    type=EventType.METRICS_UPDATE,
                    session_id=self._get_session_id(),
                    run_id=self._get_run_id(),
                    content=token_usage.model_dump(),
                )
            )

            full_content = ""
            for content in contents:
                if isinstance(content, TextResult):
                    full_content += content.text
            return self.clean_response(full_content)
        except Exception as e:
            logging.error("Error generating streaming report: %s", str(e))
            raise

    async def generate_advance_report_stream(
        self, query: str, state: State, skip_dash=False
    ) -> str:
        try:
            introduction = await self._generate_introduction_stream(
                query, state, skip_dash=skip_dash
            )
            # Quick fix to show result in the frontend
            await self.event_stream.publish(
                RealtimeEvent(
                    type=EventType.AGENT_RESPONSE,
                    session_id=self._get_session_id(),
                    run_id=self._get_run_id(),
                    content={"text": introduction},
                )
            )
            subtopics = await self._generate_subtopics_stream(
                query, state, introduction
            )
            content_from_previous_subtopics = introduction
            for subtopic in subtopics:
                subtopic_content = await self._generate_subtopic_report_stream(
                    query,
                    state,
                    subtopic,
                    content_from_previous_subtopics,
                    subtopics,
                    skip_dash,
                )
                await self.event_stream.publish(
                    RealtimeEvent(
                        type=EventType.AGENT_RESPONSE,
                        session_id=self._get_session_id(),
                        run_id=self._get_run_id(),
                        content={"text": subtopic_content},
                    )
                )
                content_from_previous_subtopics += f"\n\n{subtopic_content}"
            references = await self._generate_references_stream(
                content_from_previous_subtopics, state
            )
            await self.event_stream.publish(
                RealtimeEvent(
                    type=EventType.AGENT_RESPONSE,
                    session_id=self._get_session_id(),
                    run_id=self._get_run_id(),
                    content={"text": references},
                )
            )
            full_report = content_from_previous_subtopics + "\n\n" + references
            return full_report

        except Exception as e:
            logging.error("Error generating advance report: %s", str(e))
            raise

    async def _generate_introduction_stream(
        self, query: str, state: State, skip_dash=False
    ) -> str:
        try:
            # Extract valid URLs and add reference constraint
            valid_urls = self.extract_valid_urls_from_state(state)
            reference_constraint = self.create_reference_constraint_prompt(valid_urls)

            instruction = (
                self.config.generate_introduction_messages(query, skip_dash=skip_dash)
                + reference_constraint
            )
            messages = copy.deepcopy(state.get_messages_for_llm())
            messages.append([TextPrompt(text=instruction)])

            contents, metrics = await self.client.agenerate(
                messages=messages,
                max_tokens=8192,
                tool_choice={"type": "none"},
                system_prompt=instruction,
            )
            token_usage = TokenUsage.from_raw_metrics(
                metrics, self.client.application_model_name
            )
            await self.event_stream.publish(
                RealtimeEvent(
                    type=EventType.METRICS_UPDATE,
                    session_id=self._get_session_id(),
                    run_id=self._get_run_id(),
                    content=token_usage.model_dump(),
                )
            )
            introduction = ""
            for content in contents:
                if isinstance(content, TextResult):
                    introduction += content.text
            introduction = self.clean_response(introduction)
            print(f"Introduction: {introduction}")
            return introduction
        except Exception as e:
            logging.error("Error generating introduction: %s", str(e))
            raise

    async def _generate_subtopics_stream(
        self, query: str, state: State, introduction: str
    ) -> list[str]:
        try:
            instruction = self.config.generate_subtopics_messages(query, introduction)
            messages = copy.deepcopy(state.get_messages_for_llm())
            messages.append([TextPrompt(text=instruction)])

            contents, metrics = await self.client.agenerate(
                messages=messages,
                max_tokens=8192,
                tool_choice={"type": "none"},
                system_prompt=instruction,
            )
            token_usage = TokenUsage.from_raw_metrics(
                metrics, self.client.application_model_name
            )
            await self.event_stream.publish(
                RealtimeEvent(
                    type=EventType.METRICS_UPDATE,
                    session_id=self._get_session_id(),
                    run_id=self._get_run_id(),
                    content=token_usage.model_dump(),
                )
            )
            for content in contents:
                if isinstance(content, TextResult):
                    # Clean the response before splitting
                    cleaned_text = self.clean_response(content.text)
                    # Split by comma and strip whitespace from each subtopic
                    self.subtopics = [
                        topic.strip()
                        for topic in cleaned_text.split(",")
                        if topic.strip()
                    ]
                    return self.subtopics
            else:
                raise ValueError("subtopics response is not a text result")
        except Exception as e:
            logging.error("Error generating subtopics: %s", str(e))
            raise

    async def _generate_subtopic_report_stream(
        self,
        query: str,
        state: State,
        current_subtopic: str,
        content_from_previous_subtopics: str,
        subtopics: list[str],
        skip_dash: bool = True,
    ) -> str:
        try:
            # Extract valid URLs and add reference constraint
            valid_urls = self.extract_valid_urls_from_state(state)
            reference_constraint = self.create_reference_constraint_prompt(valid_urls)

            instruction = (
                self.config.generate_subtopic_report_messages(
                    content_from_previous_subtopics,
                    subtopics,
                    current_subtopic,
                    query,
                    skip_dash,
                )
                + reference_constraint
            )
            logging.info(f"Generating subtopic report: {current_subtopic}")
            messages = copy.deepcopy(state.get_messages_for_llm())
            messages.append([TextPrompt(text=instruction)])

            contents, metrics = await self.client.agenerate(
                messages=messages,
                max_tokens=8192,
                tool_choice={"type": "none"},
                system_prompt=instruction,
            )
            token_usage = TokenUsage.from_raw_metrics(
                metrics, self.client.application_model_name
            )
            await self.event_stream.publish(
                RealtimeEvent(
                    type=EventType.METRICS_UPDATE,
                    session_id=self._get_session_id(),
                    run_id=self._get_run_id(),
                    content=token_usage.model_dump(),
                )
            )
            subtopic_report = ""
            for content in contents:
                if isinstance(content, TextResult):
                    subtopic_report += content.text
            return self.clean_response(subtopic_report)
        except Exception as e:
            logging.error("Error generating subtopic report: %s", str(e))
            raise

    async def _generate_references_stream(
        self,
        report: str,
        state: State,
    ) -> str:
        """Generate the references section of the report with streaming.

        Args:
            state: The state containing the research trace and tool history

        Returns:
            str: The references section text

        Raises:
            Exception: If references generation fails
        """
        try:
            valid_urls = self.extract_valid_urls_from_state(state)
            reference_constraint = self.create_reference_constraint_prompt(valid_urls)
            instruction = self.config.generate_references_messages()
            messages = [
                [TextResult(text=report)],
                [TextPrompt(text=instruction + reference_constraint)],
            ]
            contents, metrics = await self.client.agenerate(
                messages=messages,
                max_tokens=8192,
                tool_choice={"type": "none"},
                system_prompt=instruction,
            )
            token_usage = TokenUsage.from_raw_metrics(
                metrics, self.client.application_model_name
            )
            await self.event_stream.publish(
                RealtimeEvent(
                    type=EventType.METRICS_UPDATE,
                    session_id=self._get_session_id(),
                    run_id=self._get_run_id(),
                    content=token_usage.model_dump(),
                )
            )
            references = ""
            for content in contents:
                if isinstance(content, TextResult):
                    references += content.text
            return self.clean_response(references)
        except Exception as e:
            logging.error("Error generating references: %s", str(e))
            return ""
