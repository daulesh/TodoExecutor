import asyncio
import json
import logging
import os
import uuid
from datetime import date, time, datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func

from app.api.deps import DatabaseSession, CurrentUser
from app.core.config import settings
from app.agents.analytics_agent import run_analytics_agent
from app.agents.briefing_agent import run_briefing_agent
from app.agents.planner_agent import run_planner_agent
from app.agents.rescheduler_agent import run_rescheduler_agent
from app.agents.orchestrator_agent import run_orchestrator_agent
from app.agents.subtasks_agent import run_subtasks_agent
from app.agents.runner_utils import TokenUsage
from app.models.models import Task
from app.services.llm_usage import (
    enforce_llm_quota,
    get_user_usage_summary,
    record_llm_usage,
)

logger = logging.getLogger(__name__)

# Inject Gemini API Key into environment variables for ADK/Gemini client
if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY

router = APIRouter()

# In-memory cache for daily briefings: key = prompt_string, value = response_text
_briefing_cache: dict[str, str] = {}


def _is_gemini_configured() -> bool:
    return bool(settings.GEMINI_API_KEY) and settings.GEMINI_API_KEY != "gemini-api-key-placeholder"


async def _persist_agent_usage(
    db: DatabaseSession,
    *,
    user_id: uuid.UUID,
    agent_name: str,
    endpoint: str,
    usage: TokenUsage,
    request_id: uuid.UUID,
) -> None:
    await record_llm_usage(
        db,
        user_id=user_id,
        agent_name=agent_name,
        endpoint=endpoint,
        usage=usage,
        request_id=request_id,
    )
    await db.commit()


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

class AgentUsageResponse(BaseModel):
    monthly_quota: int | None
    tokens_used_this_month: int
    tokens_remaining: int | None
    percent_used: float | None
    quota_enabled: bool
    model: str
    period_start: str


# ---------- Endpoints ----------

@router.get("/usage", response_model=AgentUsageResponse)
async def get_agent_usage(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Return the current user's LLM token usage for this month."""
    summary = await get_user_usage_summary(db, current_user.id)
    return AgentUsageResponse(**summary)


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

    if not _is_gemini_configured():
        return AgentInsightsResponse(
            response=(
                f"[Development Mode - Mock Gemini Coach]: I received your request: '{request_data.message}'. "
                "To enable live agent responses and ADK 2.0 tools integration, please set a valid GEMINI_API_KEY "
                "in your backend .env file."
            )
        )

    await enforce_llm_quota(db, current_user.id)
    request_id = uuid.uuid4()

    logger.info("Running analytics agent for user=%s", current_user.id)
    try:
        result = await asyncio.wait_for(
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

    await _persist_agent_usage(
        db,
        user_id=current_user.id,
        agent_name="analytics_insights_agent",
        endpoint="/agent/insights",
        usage=result.usage,
        request_id=request_id,
    )
    logger.info(
        "Analytics agent completed for user=%s tokens=%d",
        current_user.id,
        result.usage.total_tokens,
    )
    return AgentInsightsResponse(response=result.text)


@router.post("/plan", response_model=AgentPlanResponse)
async def generate_task_plan(
    request_data: AgentPlanRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Triggers the ADK 2.0 Task Planner Agent.
    """
    logger.info("POST /plan - user=%s message=%r", current_user.id, request_data.message[:80])

    if not _is_gemini_configured():
        return AgentPlanResponse(
            response=(
                f"[Development Mode - Mock Gemini Planner]: I received your planning request: '{request_data.message}'. "
                "To enable live task planning, category creation, and ADK 2.0 database tools mutation, please set a valid "
                "GEMINI_API_KEY in your backend .env file."
            )
        )

    await enforce_llm_quota(db, current_user.id)
    request_id = uuid.uuid4()

    logger.info("Running planner agent for user=%s", current_user.id)
    try:
        result = await asyncio.wait_for(
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

    await _persist_agent_usage(
        db,
        user_id=current_user.id,
        agent_name="task_planner_agent",
        endpoint="/agent/plan",
        usage=result.usage,
        request_id=request_id,
    )
    logger.info("Planner agent completed for user=%s tokens=%d", current_user.id, result.usage.total_tokens)
    return AgentPlanResponse(response=result.text)


@router.post("/chat", response_model=AgentChatResponse)
async def chat_with_assistant(
    request_data: AgentChatRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Orchestrated multi-agent chat.
    """
    logger.info("POST /chat - user=%s message=%r", current_user.id, request_data.message[:80])

    if not _is_gemini_configured():
        return AgentChatResponse(
            response=f"[Development Mode - Mock Orchestrator]: Received your message: '{request_data.message}'. Please configure a valid GEMINI_API_KEY."
        )

    await enforce_llm_quota(db, current_user.id)
    request_id = uuid.uuid4()

    logger.info("Running orchestrator agent for user=%s", current_user.id)
    try:
        result = await asyncio.wait_for(
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

    await _persist_agent_usage(
        db,
        user_id=current_user.id,
        agent_name="conversational_orchestrator",
        endpoint="/agent/chat",
        usage=result.usage,
        request_id=request_id,
    )
    logger.info("Orchestrator agent completed for user=%s tokens=%d", current_user.id, result.usage.total_tokens)
    return AgentChatResponse(response=result.text)


@router.post("/reschedule", response_model=AgentRescheduleResponse)
async def run_rescheduler(
    request_data: AgentRescheduleRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Direct endpoint for schedule date optimization.
    """
    logger.info("POST /reschedule - user=%s", current_user.id)

    if not _is_gemini_configured():
        return AgentRescheduleResponse(
            response="[Development Mode - Mock Rescheduler]: Please set a valid GEMINI_API_KEY to trigger the scheduler."
        )

    await enforce_llm_quota(db, current_user.id)
    request_id = uuid.uuid4()

    logger.info("Running rescheduler agent for user=%s", current_user.id)
    try:
        result = await asyncio.wait_for(
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

    await _persist_agent_usage(
        db,
        user_id=current_user.id,
        agent_name="task_rescheduler_agent",
        endpoint="/agent/reschedule",
        usage=result.usage,
        request_id=request_id,
    )
    logger.info("Rescheduler agent completed for user=%s tokens=%d", current_user.id, result.usage.total_tokens)
    return AgentRescheduleResponse(response=result.text)


@router.get("/briefing")
async def get_daily_briefing(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Generates a personalized daily greeting summarizing current stats.
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

    fallback = (
        f"Good morning, {username}! You have {today_count} tasks scheduled for today "
        f"and {overdue_count} overdue. Let's make today count!"
    )

    # Return fast fallback if Gemini is not configured
    if not _is_gemini_configured():
        return {"briefing": fallback}

    stats_summary = (
        f"User: {username}. "
        f"Today's pending tasks: {today_count}. "
        f"Overdue tasks: {overdue_count}. "
        f"Completed today so far: {completed_today_count}. "
        f"Upcoming tasks in cue: {', '.join(task_titles) if task_titles else 'None'}."
    )

    user_message = f"Statistics:\n{stats_summary}"

    if user_message in _briefing_cache:
        logger.info("Serving briefing from cache for user=%s", current_user.id)
        return {"briefing": _briefing_cache[user_message]}

    await enforce_llm_quota(db, current_user.id)
    request_id = uuid.uuid4()

    try:
        logger.info("Running briefing agent for user=%s", current_user.id)
        result = await asyncio.wait_for(
            run_briefing_agent(
                user_id=current_user.id,
                user_message=user_message,
            ),
            timeout=settings.GEMINI_TIMEOUT,
        )
        logger.info("Briefing agent completed for user=%s tokens=%d", current_user.id, result.usage.total_tokens)

        await _persist_agent_usage(
            db,
            user_id=current_user.id,
            agent_name="daily_briefing_agent",
            endpoint="/agent/briefing",
            usage=result.usage,
            request_id=request_id,
        )

        briefing_text = result.text
        if len(_briefing_cache) > 1000:
            _briefing_cache.clear()
        _briefing_cache[user_message] = briefing_text

        return {"briefing": briefing_text}
    except asyncio.TimeoutError:
        logger.error("Briefing agent timed out after %d seconds", settings.GEMINI_TIMEOUT)
        return {"briefing": fallback}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Briefing agent error for user=%s: %s", current_user.id, str(e))
        return {"briefing": fallback}


@router.post("/suggest-subtasks")
async def suggest_subtasks(
    request_data: SuggestSubtasksRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Queries Gemini for 3 to 5 subtask checklist items via ADK.
    """
    logger.info("POST /suggest-subtasks - user=%s title=%r", current_user.id, request_data.title[:60])

    if not _is_gemini_configured():
        return ["Analyze requirements", "Execute draft", "Review and refine"]

    await enforce_llm_quota(db, current_user.id)
    request_id = uuid.uuid4()

    try:
        logger.info("Running subtasks agent for user=%s", current_user.id)
        result = await asyncio.wait_for(
            run_subtasks_agent(
                user_id=current_user.id,
                title=request_data.title,
                description=request_data.description,
            ),
            timeout=settings.GEMINI_TIMEOUT,
        )
        await _persist_agent_usage(
            db,
            user_id=current_user.id,
            agent_name="subtasks_suggester_agent",
            endpoint="/agent/suggest-subtasks",
            usage=result.usage,
            request_id=request_id,
        )
        logger.info("Subtasks agent completed for user=%s tokens=%d", current_user.id, result.usage.total_tokens)
        return json.loads(result.text)
    except asyncio.TimeoutError:
        logger.error("Subtasks agent timed out after %d seconds", settings.GEMINI_TIMEOUT)
        return ["Analyze requirements", "Execute draft", "Review and refine"]
    except HTTPException:
        raise
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("Subtasks agent parse error for user=%s: %s", current_user.id, str(e))
        return ["Analyze requirements", "Execute draft", "Review and refine"]
    except Exception as e:
        logger.error("Subtasks agent error for user=%s: %s", current_user.id, str(e))
        return ["Analyze requirements", "Execute draft", "Review and refine"]
