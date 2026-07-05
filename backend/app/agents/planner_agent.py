import os
import json
import uuid
from datetime import date, datetime
from sqlalchemy import select

from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import Task, Category

# Inject Gemini API Key into environment variables for ADK/Gemini client
if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY


async def run_planner_agent(user_id: uuid.UUID, user_message: str) -> str:
    """
    Creates and executes the ADK 2.0 Task Planner Agent.
    Each tool manages its own database session to avoid shared-session
    concurrency issues with ADK's parallel tool execution.
    """
    
    # Tool 1: Get existing categories
    async def get_user_categories() -> str:
        """
        Retrieves all existing task categories for the current user.
        Always call this first to see if a suitable category already exists before creating a new one.
        """
        async with SessionLocal() as session:
            stmt = select(Category).where(Category.user_id == user_id)
            categories = (await session.scalars(stmt)).all()
            return json.dumps([
                {"id": str(cat.id), "title": cat.title, "color_hex": cat.color_hex}
                for cat in categories
            ])

    # Tool 2: Create a category
    async def create_category(title: str, color_hex: str = "#8B5CF6") -> str:
        """
        Creates a new task category for the user and returns the details.
        Use this if the user wants tasks grouped under a new project or topic.
        
        Args:
            title: The name of the category (e.g., "Kaggle Comp", "Project Launch").
            color_hex: Hexadecimal color representation (e.g., "#FF5733", default "#8B5CF6").
        """
        async with SessionLocal() as session:
            # Check if already exists
            stmt = select(Category).where(
                Category.user_id == user_id,
                Category.title == title
            )
            existing = await session.scalar(stmt)
            if existing:
                return json.dumps({
                    "status": "exists",
                    "id": str(existing.id),
                    "title": existing.title,
                    "color_hex": existing.color_hex
                })

            new_cat = Category(
                id=uuid.uuid4(),
                user_id=user_id,
                title=title,
                color_hex=color_hex
            )
            session.add(new_cat)
            await session.commit()
            
            return json.dumps({
                "status": "created",
                "id": str(new_cat.id),
                "title": new_cat.title,
                "color_hex": new_cat.color_hex
            })

    # Tool 3: Create a task
    async def create_task(
        title: str,
        description: str,
        target_date_str: str,
        category_id_str: str = None
    ) -> str:
        """
        Creates a new structured task and saves it to the database.
        
        Args:
            title: The task title (e.g., "Write preprocessing script").
            description: Detailed notes or instructions for the task.
            target_date_str: Target execution date formatted as YYYY-MM-DD.
            category_id_str: Optional UUID string of the category to assign this task to.
        """
        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            target_date = date.today()

        category_uuid = None
        if category_id_str:
            try:
                category_uuid = uuid.UUID(category_id_str)
            except ValueError:
                pass

        async with SessionLocal() as session:
            new_task = Task(
                id=uuid.uuid4(),
                user_id=user_id,
                category_id=category_uuid,
                title=title,
                description=description,
                target_date=target_date,
                is_completed=False
            )
            session.add(new_task)
            await session.commit()

            return json.dumps({
                "status": "created",
                "id": str(new_task.id),
                "title": new_task.title,
                "target_date": str(new_task.target_date)
            })

    # 2. Instantiate ADK Agent with planning tools
    planner_agent = Agent(
        model=settings.GEMINI_MODEL,
        name="task_planner_agent",
        instruction=(
            "You are an expert productivity planner. Your role is to help users organize their objectives "
            "by creating structured categories and lists of tasks. "
            "Always follow these steps:\n"
            "1. First, retrieve the user's existing categories using get_user_categories.\n"
            "2. If the user's objective warrants a new category (e.g., a specific project or topic), "
            "create it using create_category.\n"
            "3. Break down the user's objective into smaller, actionable tasks (e.g., 3 to 7 tasks) "
            "spread across logical target dates (starting from today YYYY-MM-DD or tomorrow).\n"
            "4. Create each task in the database using the create_task tool, associating it with the correct category ID.\n"
            "5. Finally, write a pleasant summary explaining the plan you created and listing the tasks."
        ),
        tools=[get_user_categories, create_category, create_task]
    )

    # 3. Setup InMemory session runner
    session_service = InMemorySessionService()
    runner = Runner(
        agent=planner_agent,
        app_name="task_executor_planner",
        session_service=session_service
    )
    
    user_str = str(user_id)
    session_str = "task_planner_session"
    
    # Create the session context
    await session_service.create_session(
        app_name="task_executor_planner",
        user_id=user_str,
        session_id=session_str
    )
    
    # 4. Asynchronously stream/gather the response
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
        return f"Error executing agentic planner loop: {str(e)}"
        
    return final_text or "No planning response generated by the agent."
