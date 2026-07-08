from __future__ import annotations

from dataclasses import dataclass, field

from google.adk.runners import Runner
from google.genai.types import Content


@dataclass
class TokenUsage:
    prompt_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    thoughts_tokens: int = 0
    cached_tokens: int = 0

    @classmethod
    def empty(cls) -> TokenUsage:
        return cls()

    def add(self, other: TokenUsage) -> None:
        self.prompt_tokens += other.prompt_tokens
        self.output_tokens += other.output_tokens
        self.total_tokens += other.total_tokens
        self.thoughts_tokens += other.thoughts_tokens
        self.cached_tokens += other.cached_tokens


@dataclass
class AgentRunResult:
    text: str
    usage: TokenUsage = field(default_factory=TokenUsage.empty)


def _accumulate_usage_from_event(usage: TokenUsage, event) -> None:
    metadata = getattr(event, "usage_metadata", None)
    if not metadata:
        return
    usage.prompt_tokens += metadata.prompt_token_count or 0
    usage.output_tokens += metadata.candidates_token_count or 0
    usage.total_tokens += metadata.total_token_count or 0
    usage.thoughts_tokens += metadata.thoughts_token_count or 0
    usage.cached_tokens += metadata.cached_content_token_count or 0


async def run_agent_stream(
    runner: Runner,
    *,
    user_id: str,
    session_id: str,
    new_message: Content,
    collect_all_text: bool = False,
) -> AgentRunResult:
    """
    Stream ADK runner events, accumulating response text and token usage.

    When collect_all_text is False (default), only final-response events contribute text.
    When True, all events with text parts are collected (needed for JSON subtask parsing).
    """
    final_text = ""
    usage = TokenUsage.empty()

    response_stream = runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=new_message,
    )

    async for event in response_stream:
        _accumulate_usage_from_event(usage, event)

        if not event.content or not event.content.parts:
            continue

        if collect_all_text or (
            hasattr(event, "is_final_response") and event.is_final_response()
        ):
            for part in event.content.parts:
                if part.text:
                    final_text += part.text

    return AgentRunResult(text=final_text, usage=usage)
