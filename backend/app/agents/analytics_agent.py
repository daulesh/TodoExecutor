import os
import json
import uuid
from datetime import date
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

from app.core.config import settings
from app.models.models import Task, Category, TaskChangeLog
from app.agents.runner_utils import AgentRunResult, run_agent_stream

# Inject Gemini API Key into environment variables for ADK/Gemini client
if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY


async def run_analytics_agent(db: AsyncSession, user_id: uuid.UUID, user_message: str) -> AgentRunResult:
    """
    Creates and executes the ADK 2.0 agentic AI flow to inspect database metrics
    and return professional personal coaching productivity insights.
    """
    
    # 1. Define the DB querying tool scoped to the request session and user_id
    async def get_productivity_analytics() -> str:
        """
        Retrieves real-time productivity statistics and task counts for the current user.
        Always call this tool to gather the facts before generating insights or recommendations.
        """
        today_val = date.today()
        
        # Count total and completed tasks
        total = await db.scalar(
            select(func.count(Task.id)).where(Task.user_id == user_id)
        ) or 0
        completed = await db.scalar(
            select(func.count(Task.id)).where(
                and_(Task.user_id == user_id, Task.is_completed.is_(True))
            )
        ) or 0
        pending = total - completed
        completion_rate = round((completed / total * 100), 2) if total > 0 else 0.0
        
        # Overdue tasks
        overdue = await db.scalar(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == user_id,
                    Task.is_completed.is_(False),
                    Task.target_date < today_val
                )
            )
        ) or 0
        
        # Categories breakdown
        stmt_categories = select(Category).where(Category.user_id == user_id)
        categories = (await db.scalars(stmt_categories)).all()
        breakdown = []
        for cat in categories:
            cat_total = await db.scalar(
                select(func.count(Task.id)).where(
                    and_(Task.user_id == user_id, Task.category_id == cat.id)
                )
            ) or 0
            cat_completed = await db.scalar(
                select(func.count(Task.id)).where(
                    and_(
                        Task.user_id == user_id,
                        Task.category_id == cat.id,
                        Task.is_completed.is_(True)
                    )
                )
            ) or 0
            breakdown.append({
                "category_name": cat.title,
                "total_tasks": cat_total,
                "completed_tasks": cat_completed
            })
            
        # Uncategorized tasks
        uncat_total = await db.scalar(
            select(func.count(Task.id)).where(
                and_(Task.user_id == user_id, Task.category_id.is_(None))
            )
        ) or 0
        uncat_completed = await db.scalar(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == user_id,
                    Task.category_id.is_(None),
                    Task.is_completed.is_(True)
                )
            )
        ) or 0
        if uncat_total > 0:
            breakdown.append({
                "category_name": "Uncategorized",
                "total_tasks": uncat_total,
                "completed_tasks": uncat_completed
            })
            
        # Reschedules (ChangeLog history)
        reschedule_count = await db.scalar(
            select(func.count(TaskChangeLog.id))
            .join(Task)
            .where(Task.user_id == user_id)
        ) or 0
        
        # Most rescheduled task
        stmt_most = (
            select(Task.title, func.count(TaskChangeLog.id).label("change_cnt"))
            .join(TaskChangeLog)
            .where(Task.user_id == user_id)
            .group_by(Task.id, Task.title)
            .order_by(desc("change_cnt"))
            .limit(1)
        )
        most_rescheduled_row = (await db.execute(stmt_most)).first()
        most_rescheduled = None
        if most_rescheduled_row:
            most_rescheduled = {
                "title": most_rescheduled_row[0],
                "reschedule_count": most_rescheduled_row[1]
            }
            
        summary = {
            "total_tasks": total,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "completion_rate_percentage": completion_rate,
            "overdue_tasks": overdue,
            "categories_breakdown": breakdown,
            "total_reschedules_count": reschedule_count,
            "most_rescheduled_task": most_rescheduled
        }
        return json.dumps(summary)

    # 2. Instantiate ADK Agent with tools
    insights_agent = Agent(
        model=settings.GEMINI_MODEL,
        name="analytics_insights_agent",
        instruction=(
            "You are a professional productivity coach for the TaskExecutor app. "
            "Your goal is to inspect the user's task statistics using the get_productivity_analytics tool "
            "and provide actionable insights. Do not make up facts. Always run the get_productivity_analytics "
            "tool first to check the current metrics. Suggest ways to reduce rescheduling ratios and tackle overdue "
            "tasks, and offer encouraging, high-value productivity recommendations."
        ),
        tools=[get_productivity_analytics]
    )

    # 3. Setup InMemory session runner
    session_service = InMemorySessionService()
    runner = Runner(
        agent=insights_agent,
        app_name="task_executor_coach",
        session_service=session_service
    )
    
    user_str = str(user_id)
    session_str = "analytics_insights_session"
    
    # Create the session context
    await session_service.create_session(
        app_name="task_executor_coach",
        user_id=user_str,
        session_id=session_str
    )
    
    try:
        result = await run_agent_stream(
            runner,
            user_id=user_str,
            session_id=session_str,
            new_message=Content(parts=[Part.from_text(text=user_message)]),
        )
    except Exception as e:
        return AgentRunResult(text=f"Error executing agentic loop: {str(e)}")

    if not result.text:
        return AgentRunResult(text="No response generated by the agent.", usage=result.usage)
    return result
