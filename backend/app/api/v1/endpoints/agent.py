import asyncio
import json
import logging
import os
import uuid
from datetime import date, time, datetime
from functools import partial
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func

from google import genai
from google.genai import types

from app.api.deps import DatabaseSession, CurrentUser
from app.core.config import settings
from app.agents.analytics_agent import run_analytics_agent
from app.agents.planner_agent import run_planner_agent
from app.agents.rescheduler_agent import run_rescheduler_agent
from app.agents.orchestrator_agent import run_orchestrator_agent
from app.models.models import Task

logger = logging.getLogger(__name__)

# Inject Gemini API Key into environment variables for ADK/Gemini client
if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY

router = APIRouter()

# In-memory cache for daily briefings: key = prompt_string, value = response_text
_briefing_cache: dict[str, str] = {}


def _sync_gemini_generate(prompt: str, response_mime_type: str | None = None) -> str:
    """
    Runs a synchronous Gemini generate_content call.
    MUST be called via run_in_executor to avoid blocking the async event loop.
    """
    # Configure a 15-second timeout to prevent requests from hanging indefinitely
    client = genai.Client(http_options=types.HttpOptions(timeout=15))
    config = None
    if response_mime_type:
        config = types.GenerateContentConfig(response_mime_type=response_mime_type)
    
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=config,
    )
    text = response.text or ""
    return text.strip()


async def run_gemini_in_thread(prompt: str, response_mime_type: str | None = None) -> str:
    """
    Wraps the synchronous Gemini SDK call in asyncio thread pool executor
    so that it does NOT block the uvicorn event loop.
    """
    loop = asyncio.get_event_loop()
    fn = partial(_sync_gemini_generate, prompt, response_mime_type)
    return await loop.run_in_executor(None, fn)


# ---------- Request / Response Models ----------

class AgentInsightsRequest(BaseModel):
    message: str = "Analyze my current task execution statistics and give me coaching advice."

class AgentInsightsResponse(BaseModel):
    response: str

class AgentPlanRequest(BaseModel):
    message: str = "Break down my goal to launch my Kaggle competition model in 3 weeks into structured tasks."

class AgentPlanResponse(BaseModel):
    response: str

class AgentChatRequest(BaseModel):
    message: str

class AgentChatResponse(BaseModel):
    response: str

class AgentRescheduleRequest(BaseModel):
    message: str = "Optimize my overdue and chronically rescheduled tasks."

class AgentRescheduleResponse(BaseModel):
    response: str

class SuggestSubtasksRequest(BaseModel):
    title: str
    description: str = ""


# ---------- Endpoints ----------

@router.post("/insights", response_model=AgentInsightsResponse)
async def generate_coaching_insights(
    request_data: AgentInsightsRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Triggers the ADK 2.0 Agentic AI productivity coach.
    """
    logger.info("POST /insights - user=%s", current_user.id)

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "gemini-api-key-placeholder":
        return AgentInsightsResponse(
            response=(
                f"[Development Mode - Mock Gemini Coach]: I received your request: '{request_data.message}'. "
                "To enable live agent responses and ADK 2.0 tools integration, please set a valid GEMINI_API_KEY "
                "in your backend .env file."
            )
        )

    logger.info("Running analytics agent for user=%s", current_user.id)
    try:
        response_text = await asyncio.wait_for(
            run_analytics_agent(
                db=db,
                user_id=current_user.id,
                user_message=request_data.message
            ),
            timeout=settings.GEMINI_TIMEOUT
        )
    except asyncio.TimeoutError:
        logger.error("Analytics agent timed out after %d seconds", settings.GEMINI_TIMEOUT)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The Productivity Coach agent timed out. Please try again later."
        )
    logger.info("Analytics agent completed for user=%s", current_user.id)
    return AgentInsightsResponse(response=response_text)


@router.post("/plan", response_model=AgentPlanResponse)
async def generate_task_plan(
    request_data: AgentPlanRequest,
    current_user: CurrentUser,
):
    """
    Triggers the ADK 2.0 Task Planner Agent.
    """
    logger.info("POST /plan - user=%s message=%r", current_user.id, request_data.message[:80])

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "gemini-api-key-placeholder":
        return AgentPlanResponse(
            response=(
                f"[Development Mode - Mock Gemini Planner]: I received your planning request: '{request_data.message}'. "
                "To enable live task planning, category creation, and ADK 2.0 database tools mutation, please set a valid "
                "GEMINI_API_KEY in your backend .env file."
            )
        )

    logger.info("Running planner agent for user=%s", current_user.id)
    try:
        response_text = await asyncio.wait_for(
            run_planner_agent(
                user_id=current_user.id,
                user_message=request_data.message
            ),
            timeout=settings.GEMINI_TIMEOUT
        )
    except asyncio.TimeoutError:
        logger.error("Planner agent timed out after %d seconds", settings.GEMINI_TIMEOUT)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The Task Planner agent timed out. Please try again later."
        )
    logger.info("Planner agent completed for user=%s", current_user.id)
    return AgentPlanResponse(response=response_text)


@router.post("/chat", response_model=AgentChatResponse)
async def chat_with_assistant(
    request_data: AgentChatRequest,
    current_user: CurrentUser,
):
    """
    Orchestrated multi-agent chat.
    """
    logger.info("POST /chat - user=%s message=%r", current_user.id, request_data.message[:80])

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "gemini-api-key-placeholder":
        return AgentChatResponse(
            response=f"[Development Mode - Mock Orchestrator]: Received your message: '{request_data.message}'. Please configure a valid GEMINI_API_KEY."
        )

    logger.info("Running orchestrator agent for user=%s", current_user.id)
    try:
        response_text = await asyncio.wait_for(
            run_orchestrator_agent(
                user_id=current_user.id,
                user_message=request_data.message
            ),
            timeout=settings.GEMINI_TIMEOUT
        )
    except asyncio.TimeoutError:
        logger.error("Orchestrator agent timed out after %d seconds", settings.GEMINI_TIMEOUT)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The Conversational Assistant timed out. Please try again later."
        )
    logger.info("Orchestrator agent completed for user=%s", current_user.id)
    return AgentChatResponse(response=response_text)


@router.post("/reschedule", response_model=AgentRescheduleResponse)
async def run_rescheduler(
    request_data: AgentRescheduleRequest,
    current_user: CurrentUser,
):
    """
    Direct endpoint for schedule date optimization.
    """
    logger.info("POST /reschedule - user=%s", current_user.id)

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "gemini-api-key-placeholder":
        return AgentRescheduleResponse(
            response=f"[Development Mode - Mock Rescheduler]: Please set a valid GEMINI_API_KEY to trigger the scheduler."
        )

    logger.info("Running rescheduler agent for user=%s", current_user.id)
    try:
        response_text = await asyncio.wait_for(
            run_rescheduler_agent(
                user_id=current_user.id,
                user_message=request_data.message
            ),
            timeout=settings.GEMINI_TIMEOUT
        )
    except asyncio.TimeoutError:
        logger.error("Rescheduler agent timed out after %d seconds", settings.GEMINI_TIMEOUT)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The Schedule Optimizer agent timed out. Please try again later."
        )
    logger.info("Rescheduler agent completed for user=%s", current_user.id)
    return AgentRescheduleResponse(response=response_text)


@router.get("/briefing")
async def get_daily_briefing(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Generates a personalized daily greeting summarizing current stats.
    The Gemini call is offloaded to a thread pool to avoid blocking the event loop.
    """
    logger.info("GET /briefing - user=%s", current_user.id)
    today_val = date.today()
    username = current_user.username

    # 1. Query today's pending tasks
    today_count = await db.scalar(
        select(func.count(Task.id)).where(
            Task.user_id == current_user.id,
            Task.is_completed == False,
            Task.target_date == today_val
        )
    ) or 0

    # 2. Query overdue tasks
    overdue_count = await db.scalar(
        select(func.count(Task.id)).where(
            Task.user_id == current_user.id,
            Task.is_completed == False,
            Task.target_date < today_val
        )
    ) or 0

    # 3. Query tasks completed today
    completed_today_count = await db.scalar(
        select(func.count(Task.id)).where(
            Task.user_id == current_user.id,
            Task.is_completed == True,
            Task.completed_at >= datetime.combine(today_val, time.min)
        )
    ) or 0

    # 4. Get a few upcoming task titles
    task_titles = (await db.scalars(
        select(Task.title).where(
            Task.user_id == current_user.id,
            Task.is_completed == False
        ).limit(3)
    )).all()

    logger.info(
        "Briefing stats for user=%s: today=%d overdue=%d completed_today=%d",
        current_user.id, today_count, overdue_count, completed_today_count
    )

    # Return fast fallback if Gemini is not configured
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "gemini-api-key-placeholder":
        return {
            "briefing": f"Good morning, {username}! You have {today_count} tasks scheduled for today and {overdue_count} overdue. Let's make today count!"
        }

    stats_summary = (
        f"User: {username}. "
        f"Today's pending tasks: {today_count}. "
        f"Overdue tasks: {overdue_count}. "
        f"Completed today so far: {completed_today_count}. "
        f"Upcoming tasks in cue: {', '.join(task_titles) if task_titles else 'None'}."
    )

    prompt = (
        "You are a friendly, encouraging AI productivity coach. "
        "Analyze the following daily statistics and generate a personalized morning greeting. "
        "Make it very short (1 to 2 sentences max), motivational, and mention a specific task or statistic.\n\n"
        f"Statistics:\n{stats_summary}"
    )

    # Check cache first to avoid repeating the same Gemini call on refresh
    if prompt in _briefing_cache:
        logger.info("Serving briefing from cache for user=%s", current_user.id)
        return {"briefing": _briefing_cache[prompt]}

    try:
        # ✅ Run sync Gemini SDK in thread pool - does NOT block the event loop
        logger.info("Calling Gemini for briefing (in thread) for user=%s", current_user.id)
        briefing_text = await run_gemini_in_thread(prompt)
        logger.info("Gemini briefing received for user=%s", current_user.id)
        
        # Save to cache
        if len(_briefing_cache) > 1000:
            _briefing_cache.clear() # Prune if too large
        _briefing_cache[prompt] = briefing_text
        
        return {"briefing": briefing_text}
    except Exception as e:
        logger.error("Gemini briefing error for user=%s: %s", current_user.id, str(e))
        return {
            "briefing": f"Good morning, {username}! You have {today_count} tasks scheduled for today and {overdue_count} overdue. Let's make today count!"
        }


@router.post("/suggest-subtasks")
async def suggest_subtasks(
    request_data: SuggestSubtasksRequest,
    current_user: CurrentUser,
):
    """
    Queries Gemini for 3 to 5 subtask checklist items.
    The Gemini call is offloaded to a thread pool to avoid blocking the event loop.
    """
    logger.info("POST /suggest-subtasks - user=%s title=%r", current_user.id, request_data.title[:60])

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "gemini-api-key-placeholder":
        return ["Analyze requirements", "Execute draft", "Review and refine"]

    prompt = (
        f"For the task titled: '{request_data.title}'\n"
        f"Description: '{request_data.description or ''}'\n\n"
        "Suggest 3 to 5 actionable subtasks to complete this task. "
        "Format the output strictly as a JSON list of strings, e.g. [\"Subtask 1\", \"Subtask 2\"]."
    )

    try:
        # ✅ Run sync Gemini SDK in thread pool
        logger.info("Calling Gemini for subtasks (in thread) for user=%s", current_user.id)
        raw = await run_gemini_in_thread(prompt, response_mime_type="application/json")
        logger.info("Gemini subtasks received for user=%s", current_user.id)
        return json.loads(raw)
    except Exception as e:
        logger.error("Gemini subtasks error for user=%s: %s", current_user.id, str(e))
        return ["Analyze requirements", "Execute draft", "Review and refine"]
