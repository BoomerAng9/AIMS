

from abc import abstractmethod
from typing import List

from ii_agent.llm.base import AssistantContentBlock, LLMMessages


class MessageParser:

    @abstractmethod
    def pre_llm_parse(self, messages: LLMMessages) -> LLMMessages:
        raise NotImplementedError
    
    @abstractmethod
    def post_llm_parse(self, messages: list[AssistantContentBlock]) -> list[AssistantContentBlock]:
        raise NotImplementedError
