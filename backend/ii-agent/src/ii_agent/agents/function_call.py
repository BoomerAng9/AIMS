from typing import List
from ii_agent.controller.agent import Agent
from ii_agent.controller.agent_response import AgentResponse
from ii_agent.llm.base import LLMClient, ToolParam
from ii_agent.controller.state import State
from ii_agent.core.config.agent_config import AgentConfig

TOOL_RESULT_INTERRUPT_MESSAGE = "Tool execution interrupted by user."
AGENT_INTERRUPT_MESSAGE = "Agent interrupted by user."
TOOL_CALL_INTERRUPT_FAKE_MODEL_RSP = (
    "Tool execution interrupted by user. You can resume by providing a new instruction."
)
AGENT_INTERRUPT_FAKE_MODEL_RSP = (
    "Agent interrupted by user. You can resume by providing a new instruction."
)


class FunctionCallAgent(Agent):
    def __init__(
        self,
        llm: LLMClient,
        config: AgentConfig,
        tools: List[ToolParam],
    ):
        """Initialize the agent.

        Args:
            llm: The LLM client to use
            config: The configuration for the agent
            tools: List of tools to use
        """
        super().__init__(llm, config)
        self.tools = tools

    def step(self, state: State) -> AgentResponse:
        model_response, raw_metrics = self.llm.generate(
            messages=state.get_messages_for_llm(),
            max_tokens=self.config.max_tokens_per_turn,
            tools=self.tools,
            system_prompt=self.config.system_prompt,
            temperature=self.config.temperature,
        )
        model_name = self.llm.application_model_name
        return AgentResponse.from_content_and_raw_metrics(
            content=model_response, raw_metrics=raw_metrics, model_name=model_name
        )

    async def astep(self, state: State) -> AgentResponse:
        model_response, raw_metrics = await self.llm.agenerate(
            messages=state.get_messages_for_llm(),
            max_tokens=self.config.max_tokens_per_turn,
            tools=self.tools,
            system_prompt=self.config.system_prompt,
            temperature=self.config.temperature,
        )
        model_name = self.llm.application_model_name
        return AgentResponse.from_content_and_raw_metrics(
            content=model_response, raw_metrics=raw_metrics, model_name=model_name
        )
