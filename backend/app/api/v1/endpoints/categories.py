import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from app.api.deps import DatabaseSession, CurrentUser
from app.models.models import Category
from app.schemas.schemas import CategoryResponse

router = APIRouter()

@router.get("", response_model=List[CategoryResponse])
async def read_categories(
    db: DatabaseSession,
    current_user: CurrentUser,
) -> List[Category]:
    """Retrieve all categories for the authenticated user, ordered alphabetically."""
    stmt = (
        select(Category)
        .where(Category.user_id == current_user.id)
        .order_by(Category.title.asc())
    )
    categories = (await db.scalars(stmt)).all()
    return list(categories)
