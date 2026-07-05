import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, and_, desc, Integer, cast
from sqlalchemy.orm import joinedload, selectinload
from app.api.deps import DatabaseSession, CurrentUser
from app.models.models import Task, Category, TaskChangeLog
from app.schemas.schemas import (
    AnalyticsSummary,
    CategoryBreakdown,
    MostRescheduledTask,
    TaskDetailResponse,
)

router = APIRouter()

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    db: DatabaseSession,
    current_user: CurrentUser,
) -> AnalyticsSummary:
    """Retrieve aggregate productivity analytics for the current user."""
    today_val = date.today()
    
    # 1. Total, Completed, Pending counts
    total = await db.scalar(
        select(func.count(Task.id)).where(Task.user_id == current_user.id)
    ) or 0
    
    completed = await db.scalar(
        select(func.count(Task.id)).where(
            and_(Task.user_id == current_user.id, Task.is_completed == True)
        )
    ) or 0
    
    pending = total - completed
    
    completion_rate = round((completed / total * 100), 2) if total > 0 else 0.0
    
    # 2. Overdue tasks (incomplete and target date in the past)
    overdue = await db.scalar(
        select(func.count(Task.id)).where(
            and_(
                Task.user_id == current_user.id,
                Task.is_completed == False,
                Task.target_date < today_val
            )
        )
    ) or 0

    # 3. Tasks by Category breakdown
    # We query all categories owned by the user
    stmt_categories = select(Category).where(Category.user_id == current_user.id)
    categories = (await db.scalars(stmt_categories)).all()
    
    breakdown_list = []
    
    for category in categories:
        # Get count for this category
        cat_total = await db.scalar(
            select(func.count(Task.id)).where(
                and_(Task.user_id == current_user.id, Task.category_id == category.id)
            )
        ) or 0
        cat_completed = await db.scalar(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == current_user.id,
                    Task.category_id == category.id,
                    Task.is_completed == True
                )
            )
        ) or 0
        breakdown_list.append(
            CategoryBreakdown(
                category_id=category.id,
                category_name=category.title,
                total=cat_total,
                completed=cat_completed
            )
        )
        
    # Also add "Uncategorized" breakdown
    uncat_total = await db.scalar(
        select(func.count(Task.id)).where(
            and_(Task.user_id == current_user.id, Task.category_id == None)
        )
    ) or 0
    uncat_completed = await db.scalar(
        select(func.count(Task.id)).where(
            and_(
                Task.user_id == current_user.id,
                Task.category_id == None,
                Task.is_completed == True
            )
        )
    ) or 0
    if uncat_total > 0:
        breakdown_list.append(
            CategoryBreakdown(
                category_id=None,
                category_name="Uncategorized",
                total=uncat_total,
                completed=uncat_completed
            )
        )

    # 4. Total rescheduled count (all target-date changes)
    reschedule_count = await db.scalar(
        select(func.count(TaskChangeLog.id))
        .join(Task)
        .where(Task.user_id == current_user.id)
    ) or 0

    # 5. Most rescheduled task
    stmt_most = (
        select(Task.id, Task.title, func.count(TaskChangeLog.id).label("change_cnt"))
        .join(TaskChangeLog)
        .where(Task.user_id == current_user.id)
        .group_by(Task.id, Task.title)
        .order_by(desc("change_cnt"))
        .limit(1)
    )
    most_rescheduled_row = (await db.execute(stmt_most)).first()
    
    most_rescheduled = None
    if most_rescheduled_row:
        most_rescheduled = MostRescheduledTask(
            task_id=most_rescheduled_row[0],
            title=most_rescheduled_row[1],
            reschedule_count=most_rescheduled_row[2]
        )

    return AnalyticsSummary(
        total_tasks=total,
        completed_tasks=completed,
        pending_tasks=pending,
        completion_rate=completion_rate,
        overdue_tasks=overdue,
        tasks_by_category=breakdown_list,
        date_change_count=reschedule_count,
        most_rescheduled_task=most_rescheduled
    )
