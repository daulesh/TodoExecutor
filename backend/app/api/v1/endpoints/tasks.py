import uuid
from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import joinedload, selectinload
from app.api.deps import DatabaseSession, CurrentUser
from app.models.models import Task, Category, TaskChangeLog
from app.schemas.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskDetailResponse,
    TaskComplete,
    TaskChangeLogResponse,
)

router = APIRouter()

@router.get("", response_model=List[TaskResponse])
async def read_tasks(
    db: DatabaseSession,
    current_user: CurrentUser,
    date: Optional[date] = Query(None, description="Exact date filter"),
    start_date: Optional[date] = Query(None, description="Start date range"),
    end_date: Optional[date] = Query(None, description="End date range"),
    is_completed: Optional[bool] = Query(None, description="Filter by completion status"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by category ID"),
) -> List[Task]:
    """Retrieve tasks with filtering options."""
    # Mutually exclusive parameter check
    if date is not None and (start_date is not None or end_date is not None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot use 'date' together with 'start_date' or 'end_date'.",
        )

    # Base query for tasks owned by user, preloading the category relationship to prevent N+1
    stmt = select(Task).where(Task.user_id == current_user.id).options(joinedload(Task.category))

    # Apply date filters
    if date is not None:
        stmt = stmt.where(Task.target_date == date)
    else:
        if start_date is not None:
            stmt = stmt.where(Task.target_date >= start_date)
        if end_date is not None:
            stmt = stmt.where(Task.target_date <= end_date)

    # Apply completion filter
    if is_completed is not None:
        stmt = stmt.where(Task.is_completed == is_completed)

    # Apply category filter
    if category_id is not None:
        stmt = stmt.where(Task.category_id == category_id)

    # Ordering: target_date ASC, then start_time ASC (nulls last)
    stmt = stmt.order_by(Task.target_date.asc(), Task.start_time.asc())

    tasks = (await db.scalars(stmt)).all()
    
    # Map target_time to start_time on schemas dynamically
    for t in tasks:
        t.target_time = t.start_time
        
    return list(tasks)

@router.get("/{task_id}", response_model=TaskDetailResponse)
async def read_task_by_id(
    db: DatabaseSession,
    current_user: CurrentUser,
    task_id: uuid.UUID,
) -> Task:
    """Retrieve a single task by ID."""
    stmt = (
        select(Task)
        .where(and_(Task.id == task_id, Task.user_id == current_user.id))
        .options(joinedload(Task.category), selectinload(Task.change_history))
    )
    task = (await db.execute(stmt)).scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )
    
    task.target_time = task.start_time
    return task

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    db: DatabaseSession,
    current_user: CurrentUser,
    task_in: TaskCreate,
) -> Task:
    """Create a new task."""
    # Verify category ownership if provided
    if task_in.category_id is not None:
        category = await db.get(Category, task_in.category_id)
        if not category or category.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found.",
            )

    db_task = Task(
        user_id=current_user.id,
        category_id=task_in.category_id,
        title=task_in.title,
        description=task_in.description,
        target_date=task_in.target_date,
        estimated_duration_minutes=task_in.estimated_duration_minutes,
        start_time=task_in.start_time,
        end_time=task_in.end_time,
        is_completed=False,
    )
    
    db.add(db_task)
    await db.flush()
    
    # Eagerly load relationship
    stmt = select(Task).where(Task.id == db_task.id).options(joinedload(Task.category))
    loaded_task = (await db.execute(stmt)).scalar_one()
    loaded_task.target_time = loaded_task.start_time
    
    await db.commit()
    return loaded_task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    db: DatabaseSession,
    current_user: CurrentUser,
    task_id: uuid.UUID,
    task_in: TaskUpdate,
) -> Task:
    """Update a task, validating target_date modifications."""
    stmt = (
        select(Task)
        .where(and_(Task.id == task_id, Task.user_id == current_user.id))
        .options(joinedload(Task.category))
    )
    task = (await db.execute(stmt)).scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )

    # Verify category ownership if updated
    if task_in.category_id is not None and task_in.category_id != task.category_id:
        category = await db.get(Category, task_in.category_id)
        if not category or category.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found.",
            )

    # Check for target_date changes
    if task_in.target_date != task.target_date:
        if not task_in.change_reason or not task_in.change_reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A change_reason is required when modifying target_date.",
            )
        
        # Log the change
        change_log = TaskChangeLog(
            task_id=task.id,
            reason=task_in.change_reason,
            original_target_date=task.target_date,
            new_target_date=task_in.target_date,
        )
        db.add(change_log)
        task.target_date = task_in.target_date

    # Update other fields
    task.title = task_in.title
    task.description = task_in.description
    task.estimated_duration_minutes = task_in.estimated_duration_minutes
    task.start_time = task_in.start_time
    task.end_time = task_in.end_time
    task.category_id = task_in.category_id
    task.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(task)
    
    # Preload the category to return it
    stmt_reload = select(Task).where(Task.id == task.id).options(joinedload(Task.category))
    reloaded = (await db.execute(stmt_reload)).scalar_one()
    reloaded.target_time = reloaded.start_time
    
    return reloaded

@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    db: DatabaseSession,
    current_user: CurrentUser,
    task_id: uuid.UUID,
    complete_in: TaskComplete,
) -> Task:
    """Mark a task as completed or reopen it."""
    stmt = (
        select(Task)
        .where(and_(Task.id == task_id, Task.user_id == current_user.id))
        .options(joinedload(Task.category))
    )
    task = (await db.execute(stmt)).scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )

    task.is_completed = complete_in.is_completed
    if complete_in.is_completed:
        task.completed_at = datetime.now(timezone.utc)
        task.actual_duration_minutes = complete_in.actual_duration_minutes
        task.completion_notes = complete_in.completion_notes
    else:
        task.completed_at = None
        task.actual_duration_minutes = None
        task.completion_notes = None

    task.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(task)
    
    task.target_time = task.start_time
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    db: DatabaseSession,
    current_user: CurrentUser,
    task_id: uuid.UUID,
) -> None:
    """Delete a task."""
    stmt = select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id))
    task = (await db.execute(stmt)).scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )
        
    await db.delete(task)
    await db.commit()

@router.get("/{task_id}/changes", response_model=List[TaskChangeLogResponse])
async def read_task_change_log(
    db: DatabaseSession,
    current_user: CurrentUser,
    task_id: uuid.UUID,
) -> List[TaskChangeLog]:
    """Retrieve the change log history for a task."""
    stmt = select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id))
    task = (await db.execute(stmt)).scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )
        
    log_stmt = select(TaskChangeLog).where(TaskChangeLog.task_id == task_id).order_by(TaskChangeLog.changed_at.desc())
    logs = (await db.scalars(log_stmt)).all()
    return list(logs)
