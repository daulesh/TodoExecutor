import os
import json
import uuid
from datetime import date, datetime
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import Task, TaskChangeLog

# Inject Gemini API Key into environment variables for ADK/Gemini client
if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY


async def run_rescheduler_agent(user_id: uuid.UUID, user_message: str) -> str:
    """
    Creates and executes the ADK 2.0 Rescheduler Agent.
    Identifies tasks that are overdue or have been rescheduled multiple times,
    and moves their target dates to optimized, realistic dates.
    """

    # Tool 1: Get chronically rescheduled or overdue tasks
    async def get_chronically_rescheduled_tasks() -> str:
        """
        Retrieves incomplete tasks for the current user that are either overdue (target date is in the past)
        or have already been rescheduled one or more times.
        """
        today_val = date.today()
        async with SessionLocal() as session:
            stmt = (
                select(Task)
                .options(selectinload(Task.change_history))
                .where(Task.user_id == user_id, Task.is_completed == False)
                .order_by(Task.target_date.asc())
            )
            tasks = (await session.scalars(stmt)).all()
            
            flagged_tasks = []
            for task in tasks:
                reschedule_count = len(task.change_history)
                is_overdue = task.target_date < today_val
                
                if reschedule_count > 0 or is_overdue:
                    flagged_tasks.append({
                        "id": str(task.id),
                        "title": task.title,
                        "description": task.description or "",
                        "current_target_date": str(task.target_date),
                        "reschedule_count": reschedule_count,
                        "is_overdue": is_overdue,
                        "history": [
                            {
                                "original": str(log.original_target_date),
                                "new": str(log.new_target_date),
                                "reason": log.reason
                            }
                            for log in task.change_history
                        ]
                    })
            
            return json.dumps(flagged_tasks)

    # Tool 2: Reschedule a specific task
    async def reschedule_task(task_id: str, new_target_date_str: str, reason: str) -> str:
        """
        Updates the target date of a task and logs the reason for rescheduling.
        
        Args:
            task_id: The UUID string of the task to reschedule.
            new_target_date_str: The new target date formatted as YYYY-MM-DD.
            reason: Explanation for the reschedule (e.g., 'Overloaded schedule', 'Prerequisite delayed').
        """
        try:
            new_date = datetime.strptime(new_target_date_str, "%Y-%m-%d").date()
        except ValueError:
            return json.dumps({"status": "error", "message": f"Invalid date format: {new_target_date_str}"})

        async with SessionLocal() as session:
            try:
                task_uuid = uuid.UUID(task_id)
            except ValueError:
                return json.dumps({"status": "error", "message": f"Invalid task_id UUID format: {task_id}"})

            task = await session.get(Task, task_uuid)
            if not task:
                return json.dumps({"status": "error", "message": "Task not found"})

            original_date = task.target_date
            
            # Create the change log entry
            change_log = TaskChangeLog(
                id=uuid.uuid4(),
                task_id=task.id,
                reason=reason,
                original_target_date=original_date,
                new_target_date=new_date
            )
            
            task.target_date = new_date
            session.add(change_log)
            await session.commit()
            
            return json.dumps({
                "status": "success",
                "task_id": str(task.id),
                "title": task.title,
                "original_target_date": str(original_date),
                "new_target_date": str(new_date)
            })

    # 2. Instantiate ADK Agent with rescheduling tools.
    # Inject real today's date into the prompt so the LLM never defaults to a stale date from training data.
    today_str = date.today().isoformat()  # e.g. "2026-07-06"

    rescheduler_agent = Agent(
        model=settings.GEMINI_MODEL,
        name="task_rescheduler_agent",
        instruction=(
            f"You are an autonomous productivity optimizer. Your job is to help users reorganize chronically "
            f"rescheduled or overdue tasks into a healthy, balanced schedule.\n"
            f"CRITICAL — TODAY'S REAL DATE IS: {today_str}. "
            f"You MUST use {today_str} as your anchor for 'today'. "
            f"All rescheduled dates MUST be on or after {today_str}. "
            f"Never schedule tasks into the past or into years before {today_str[:4]}.\n"
            "Always follow these steps:\n"
            "1. First, retrieve the list of problematic tasks using get_chronically_rescheduled_tasks.\n"
            "2. If no tasks are returned, notify the user that their schedule is in excellent health.\n"
            f"3. For each flagged task, determine a realistic and balanced new target date starting from {today_str}. "
            f"Distribute tasks across consecutive days so the user is not overloaded on any single day.\n"
            "4. Call the reschedule_task tool for each task you decide to optimize.\n"
            "5. Provide a clean before/after summary using EXACTLY this format for every rescheduled task — no deviations:\n"
            "**[Task Title]**\n"
            "* Original Date: YYYY-MM-DD\n"
            "* New Date: YYYY-MM-DD\n"
            "* Reason: [one sentence reason]\n\n"
            "STRICT RULES:\n"
            "   - NEVER include task IDs or UUIDs in the output.\n"
            "   - NEVER show raw JSON or internal fields.\n"
            "   - Use the exact bullet format above for every task, no exceptions.\n"
            "   - Keep the reason to a single concise sentence."
        ),
        tools=[get_chronically_rescheduled_tasks, reschedule_task]
    )

    # 3. Setup InMemory session runner
    session_service = InMemorySessionService()
    runner = Runner(
        agent=rescheduler_agent,
        app_name="task_executor_rescheduler",
        session_service=session_service
    )
    
    user_str = str(user_id)
    session_str = "task_rescheduler_session"
    
    # Create the session context
    await session_service.create_session(
        app_name="task_executor_rescheduler",
        user_id=user_str,
        session_id=session_str
    )
    
    # 4. Stream response
    final_text = ""
    try:
        response_stream = runner.run_async(
            user_id=user_str,
            session_id=session_str,
            new_message=Content(parts=[Part.from_text(text=user_message)])
        )
        
        async for event in response_stream:
            if event.is_final_response() and event.content and event.content.parts:
                final_text += "".join(part.text for part in event.content.parts if part.text)
                
    except Exception as e:
        return f"Error executing agentic rescheduler loop: {str(e)}"
        
    return final_text or "No rescheduling response generated by the agent."
