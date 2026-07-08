import json
import os
import re
import uuid

from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

from app.core.config import settings
from app.agents.runner_utils import AgentRunResult, run_agent_stream

if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY


def _parse_subtasks_json(raw: str) -> list[str]:
    text = raw.strip()
    if not text:
        raise ValueError("Empty response from model")

    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence_match:
        text = fence_match.group(1).strip()

    array_match = re.search(r"\[[\s\S]*\]", text)
    if array_match:
        text = array_match.group(0)

    parsed = json.loads(text)
    if not isinstance(parsed, list):
        raise ValueError("Expected JSON array of strings")

    subtasks = [str(item).strip() for item in parsed if str(item).strip()]
    if not subtasks:
        raise ValueError("JSON array contained no subtasks")
    return subtasks


async def run_subtasks_agent(user_id: uuid.UUID, title: str, description: str = "") -> AgentRunResult:
    """
    Suggests 3 to 5 actionable subtasks for a task via ADK.
    """
    user_message = (
        f"For the task titled: '{title}'\n"
        f"Description: '{description or ''}'\n\n"
        "Suggest 3 to 5 actionable subtasks to complete this task. "
        'Return ONLY a JSON array of strings, e.g. ["Subtask 1", "Subtask 2"]. '
        "Do not wrap the JSON in markdown or add any other text."
    )

    subtasks_agent = Agent(
        model=settings.GEMINI_MODEL,
        name="subtasks_suggester_agent",
        instruction=(
            "You suggest actionable subtask checklists for productivity tasks. "
            "Your entire reply must be a single valid JSON array of strings with no markdown, "
            "no code fences, and no extra commentary."
        ),
    )

    session_service = InMemorySessionService()
    runner = Runner(
        agent=subtasks_agent,
        app_name="task_executor_subtasks",
        session_service=session_service,
    )

    user_str = str(user_id)
    session_str = f"subtasks_{uuid.uuid4()}"

    await session_service.create_session(
        app_name="task_executor_subtasks",
        user_id=user_str,
        session_id=session_str,
    )

    try:
        result = await run_agent_stream(
            runner,
            user_id=user_str,
            session_id=session_str,
            new_message=Content(parts=[Part.from_text(text=user_message)]),
            collect_all_text=True,
        )
    except Exception as e:
        raise RuntimeError(f"Error executing subtasks agent: {str(e)}") from e

    subtasks = _parse_subtasks_json(result.text)
    return AgentRunResult(text=json.dumps(subtasks), usage=result.usage)
