import os
import uuid

from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

from app.core.config import settings
from app.agents.runner_utils import AgentRunResult, run_agent_stream

if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY


async def run_briefing_agent(user_id: uuid.UUID, user_message: str) -> AgentRunResult:
    """
    Generates a short personalized daily briefing via ADK.
    """
    briefing_agent = Agent(
        model=settings.GEMINI_MODEL,
        name="daily_briefing_agent",
        instruction=(
            "You are a friendly, encouraging AI productivity coach. "
            "Analyze the user's daily statistics and generate a personalized morning greeting. "
            "Make it very short (1 to 2 sentences max), motivational, and mention a specific task or statistic."
        ),
    )

    session_service = InMemorySessionService()
    runner = Runner(
        agent=briefing_agent,
        app_name="task_executor_briefing",
        session_service=session_service,
    )

    user_str = str(user_id)
    session_str = "daily_briefing_session"

    await session_service.create_session(
        app_name="task_executor_briefing",
        user_id=user_str,
        session_id=session_str,
    )

    try:
        result = await run_agent_stream(
            runner,
            user_id=user_str,
            session_id=session_str,
            new_message=Content(parts=[Part.from_text(text=user_message)]),
        )
    except Exception as e:
        raise RuntimeError(f"Error executing briefing agent: {str(e)}") from e

    if not result.text:
        return AgentRunResult(text="Good morning! Let's make today count.", usage=result.usage)
    return result
