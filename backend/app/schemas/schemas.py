import uuid
from datetime import date, time, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator
from typing_extensions import Self

# ---------------------------------------------
# Category Schemas
# ---------------------------------------------
class CategoryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=50)
    color_hex: str = Field("#6C63FF", pattern="^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = Field(None, max_length=50)

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID

# ---------------------------------------------
# User Schemas
# ---------------------------------------------
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., max_length=255)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    username: str
    email: str
    auth_provider: str
    avatar_url: Optional[str] = None
    created_at: datetime

# ---------------------------------------------
# Auth Response
# ---------------------------------------------
class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    google_id_token: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# ---------------------------------------------
# Task Change Log Schemas
# ---------------------------------------------
class TaskChangeLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    task_id: uuid.UUID
    reason: str
    original_target_date: date
    new_target_date: date
    changed_at: datetime

# ---------------------------------------------
# Task Schemas
# ---------------------------------------------
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    target_date: date
    estimated_duration_minutes: Optional[int] = Field(None, ge=1)
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class TaskCreate(TaskBase):
    category_id: Optional[uuid.UUID] = None

class TaskUpdate(TaskBase):
    category_id: Optional[uuid.UUID] = None
    change_reason: Optional[str] = Field(None, max_length=500)

class TaskComplete(BaseModel):
    is_completed: bool
    actual_duration_minutes: Optional[int] = Field(None, ge=0)
    completion_notes: Optional[str] = Field(None, max_length=2000)

class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    is_completed: bool
    actual_duration_minutes: Optional[int] = None
    completion_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    
    # Custom serializers to ensure "HH:MM" string format in JSON output
    @field_serializer("start_time", "end_time", when_used="json")
    def serialize_time(self, v: Optional[time]) -> Optional[str]:
        if v is None:
            return None
        return v.strftime("%H:%M")

class TaskDetailResponse(TaskResponse):
    change_history: List[TaskChangeLogResponse] = []

# ---------------------------------------------
# Analytics Schemas
# ---------------------------------------------
class CategoryBreakdown(BaseModel):
    category_id: Optional[uuid.UUID] = None
    category_name: str
    total: int
    completed: int

class MostRescheduledTask(BaseModel):
    task_id: uuid.UUID
    title: str
    reschedule_count: int

class AnalyticsSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_rate: float
    overdue_tasks: int
    tasks_by_category: List[CategoryBreakdown]
    date_change_count: int
    most_rescheduled_task: Optional[MostRescheduledTask] = None
