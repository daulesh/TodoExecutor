from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.runner_utils import TokenUsage
from app.core.config import settings
from app.models.models import LlmUsageLog


def month_start_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


async def get_user_monthly_tokens(db: AsyncSession, user_id: uuid.UUID) -> int:
    start = month_start_utc()
    used = await db.scalar(
        select(func.coalesce(func.sum(LlmUsageLog.total_tokens), 0)).where(
            LlmUsageLog.user_id == user_id,
            LlmUsageLog.created_at >= start,
        )
    )
    return int(used or 0)


async def enforce_llm_quota(db: AsyncSession, user_id: uuid.UUID) -> None:
    quota = settings.LLM_MONTHLY_TOKEN_QUOTA
    if quota <= 0:
        return

    used = await get_user_monthly_tokens(db, user_id)
    if used >= quota:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Monthly AI token quota exceeded ({used:,} / {quota:,} tokens used). "
                "Quota resets at the start of next month."
            ),
        )


async def record_llm_usage(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    agent_name: str,
    endpoint: str,
    usage: TokenUsage,
    request_id: uuid.UUID | None = None,
) -> None:
    if usage.total_tokens <= 0:
        return

    db.add(
        LlmUsageLog(
            user_id=user_id,
            agent_name=agent_name,
            endpoint=endpoint,
            model=settings.GEMINI_MODEL,
            prompt_tokens=usage.prompt_tokens,
            output_tokens=usage.output_tokens,
            total_tokens=usage.total_tokens,
            thoughts_tokens=usage.thoughts_tokens or None,
            cached_tokens=usage.cached_tokens or None,
            request_id=request_id,
        )
    )


async def get_user_usage_summary(db: AsyncSession, user_id: uuid.UUID) -> dict:
    quota = settings.LLM_MONTHLY_TOKEN_QUOTA
    used = await get_user_monthly_tokens(db, user_id)
    remaining = None if quota <= 0 else max(quota - used, 0)
    percent_used = None if quota <= 0 else min(round((used / quota) * 100, 1), 100.0)

    return {
        "monthly_quota": quota if quota > 0 else None,
        "tokens_used_this_month": used,
        "tokens_remaining": remaining,
        "percent_used": percent_used,
        "quota_enabled": quota > 0,
        "model": settings.GEMINI_MODEL,
        "period_start": month_start_utc().isoformat(),
    }
