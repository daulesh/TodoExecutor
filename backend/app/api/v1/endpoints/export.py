from typing import List
from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from app.api.deps import DatabaseSession, CurrentUser
from app.models.models import Task
from app.schemas.schemas import TaskDetailResponse

router = APIRouter()

@router.get("/json", response_model=List[TaskDetailResponse])
async def export_user_data_json(
    db: DatabaseSession,
    current_user: CurrentUser,
) -> List[Task]:
    """Export all task and category data for the authenticated user."""
    stmt = (
        select(Task)
        .where(Task.user_id == current_user.id)
        .options(joinedload(Task.category), selectinload(Task.change_history))
        .order_by(Task.target_date.asc(), Task.start_time.asc())
    )
    tasks = (await db.scalars(stmt)).all()
    
    # Map target_time to start_time
    for t in tasks:
        t.target_time = t.start_time
        
    return list(tasks)
