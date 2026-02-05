from abc import ABC, abstractmethod


class BaseMCPIntegration(ABC):

    @property
    @abstractmethod
    def selected_tool_names(self) -> list[str]:
        pass

    @property
    @abstractmethod
    def config(self, **kwargs) -> dict:
        pass