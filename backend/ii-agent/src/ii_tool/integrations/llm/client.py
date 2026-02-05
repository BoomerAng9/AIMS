from abc import ABC
from ii_tool.integrations.llm.config import LLMConfig
from openai import AsyncOpenAI
from typing import Literal
from pydantic import BaseModel
from ii_agent.utils.constants import is_gpt5_family


class LLMResult(BaseModel):
    content: str
    cost: float


# Prices per 1M tokens.
# https://platform.openai.com/docs/pricing
model_name_to_cost = {
    "gpt-5-mini": {
        "input": 0.25,
        "output": 2.0,
    },
    "gpt-4.1-mini": {
        "input": 0.4,
        "output": 1.6,
    },
}


class LLMClient(ABC):
    def __init__(self, llm_config: LLMConfig):
        if not llm_config.openai_api_key:
            raise ValueError("OpenAI API key is required to initialize LLMClient")
        self.model_name = llm_config.openai_model
        if self.model_name not in model_name_to_cost:
            raise ValueError(f"Model {self.model_name} not supported")
        self.llm_client = AsyncOpenAI(
            api_key=llm_config.openai_api_key,
        )
        if llm_config.openai_base_url:
            self.llm_client.base_url = llm_config.openai_base_url

    def _calculate_cost(
        self, model_name: str, input_tokens: int, output_tokens: int
    ) -> float:
        cost_info = model_name_to_cost[model_name]
        return (
            input_tokens * cost_info["input"] + output_tokens * cost_info["output"]
        ) / 1_000_000

    async def generate(
        self,
        prompt: str,
        reasoning_effort: Literal["low", "medium", "high"] = "low",
        temperature: float | None = None,
        max_output_tokens: int = 4096,
    ) -> LLMResult:
        if is_gpt5_family(self.model_name):
            response = await self.llm_client.responses.create(
                model=self.model_name,
                input=prompt,
                reasoning={"effort": reasoning_effort},
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            )
            content = response.output_text
            usage_obj = response.usage
            input_tokens = usage_obj.input_tokens
            output_tokens = usage_obj.output_tokens
            cost = self._calculate_cost(self.model_name, input_tokens, output_tokens)

            return LLMResult(content=content, cost=cost)

        else:
            response = await self.llm_client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_completion_tokens=max_output_tokens,
            )
            content = response.choices[0].message.content
            usage_obj = response.usage
            input_tokens = usage_obj.prompt_tokens
            output_tokens = usage_obj.completion_tokens
            cost = self._calculate_cost(self.model_name, input_tokens, output_tokens)

            return LLMResult(content=content, cost=cost)
