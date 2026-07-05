import asyncio
import uuid
from datetime import date, timedelta, datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Fix path to resolve app modules
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.models import User, Category, Task, TaskChangeLog


async def seed():
    print(f"Connecting to database: {settings.DATABASE_URL}...")
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as db:
        # 1. Create or fetch test user
        email = "coach_demo@example.com"
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            print("Creating test user: coach_demo@example.com...")
            user = User(
                id=uuid.uuid4(),
                username="CoachDemo",
                email=email,
                password_hash=get_password_hash("demo12345"),
                auth_provider="local",
                is_active=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            print("Test user coach_demo@example.com already exists.")

        # 2. Add some demo Categories
        categories_data = [
            {"title": "Work", "color_hex": "#FF6B6B"},
            {"title": "Personal", "color_hex": "#6C63FF"},
            {"title": "Other", "color_hex": "#2ECB71"},
            {"title": "Kaggle Project", "color_hex": "#F59E0B"},
            {"title": "Health", "color_hex": "#10B981"}
        ]
        
        seeded_categories = {}
        for cat_info in categories_data:
            # Check if category already exists
            stmt = select(Category).where(
                Category.user_id == user.id,
                Category.title == cat_info["title"]
            )
            res = await db.execute(stmt)
            cat = res.scalar_one_or_none()
            
            if not cat:
                cat = Category(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    title=cat_info["title"],
                    color_hex=cat_info["color_hex"]
                )
                db.add(cat)
            seeded_categories[cat_info["title"]] = cat

        await db.commit()
        for cat in seeded_categories.values():
            await db.refresh(cat)

        # 3. Add Tasks
        today = date.today()
        yesterday = today - timedelta(days=1)
        three_days_ago = today - timedelta(days=3)
        tomorrow = today + timedelta(days=1)

        # Let's clean up existing tasks to prevent massive seed bloat (optional, but good for clean demo stats)
        # We will keep seeding cumulative tasks instead, checking if they exist
        
        demo_tasks = [
            # Completed tasks
            {
                "title": "Complete Kaggle model architecture definition",
                "description": "Design base ResNet neural net definition using Keras/PyTorch.",
                "target_date": yesterday,
                "is_completed": True,
                "category": "Kaggle Project",
                "actual_duration_minutes": 120,
                "completion_notes": "Implemented ResNet50 model pipeline, validation set split at 20% looks correct.",
                "reschedule_count": 0
            },
            {
                "title": "Evening run & stretching",
                "description": "5km jog around the park.",
                "target_date": yesterday,
                "is_completed": True,
                "category": "Health",
                "actual_duration_minutes": 45,
                "completion_notes": "Perfect pace, average heart rate 142 bpm.",
                "reschedule_count": 0
            },
            # Pending tasks (Today)
            {
                "title": "Train baseline XGBoost model",
                "description": "Prepare CSV files, optimize hyperparams, and save weights.",
                "target_date": today,
                "is_completed": False,
                "category": "Kaggle Project",
                "reschedule_count": 1,
                "original_date": yesterday,
                "reschedule_reason": "Data preprocessing script took longer to debug than expected."
            },
            {
                "title": "Review team code changes",
                "description": "Review PR #45 regarding category endpoints authentication wrapper.",
                "target_date": today,
                "is_completed": False,
                "category": "Work",
                "reschedule_count": 0
            },
            # Overdue tasks
            {
                "title": "Update backup export documentation",
                "description": "Need to draft details on the PostgreSQL JSON export structure.",
                "target_date": three_days_ago,
                "is_completed": False,
                "category": "Work",
                "reschedule_count": 0
            },
            {
                "title": "Schedule dentist appointment",
                "description": "Regular teeth cleaning checkout.",
                "target_date": yesterday,
                "is_completed": False,
                "category": "Personal",
                "reschedule_count": 2,
                "original_date": three_days_ago,
                "reschedule_reason": "Dentist office was closed for holiday."
            },
            # Chronically rescheduled task (Reschedule Peak)
            {
                "title": "Optimize transformer hyperparameters",
                "description": "Tweak learning rate decay and model parameters on Kaggle platform.",
                "target_date": tomorrow,
                "is_completed": False,
                "category": "Kaggle Project",
                "reschedule_count": 4,
                "original_date": today - timedelta(days=3),
                "reschedule_reason": "GPU quota exhausted on Kaggle server."
            }
        ]

        print("Seeding tasks and history logs...")
        for task_info in demo_tasks:
            # Check if task already exists
            stmt = select(Task).where(
                Task.user_id == user.id,
                Task.title == task_info["title"]
            )
            res = await db.execute(stmt)
            task = res.scalar_one_or_none()
            
            if not task:
                category_obj = seeded_categories.get(task_info["category"])
                task = Task(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    category_id=category_obj.id if category_obj else None,
                    title=task_info["title"],
                    description=task_info.get("description"),
                    target_date=task_info["target_date"],
                    is_completed=task_info["is_completed"],
                    actual_duration_minutes=task_info.get("actual_duration_minutes"),
                    completion_notes=task_info.get("completion_notes")
                )
                db.add(task)
                await db.commit()
                await db.refresh(task)

                # Seed rescheduling logs if reschedule_count > 0
                r_cnt = task_info.get("reschedule_count", 0)
                if r_cnt > 0:
                    orig_date = task_info.get("original_date", task_info["target_date"] - timedelta(days=r_cnt))
                    reason = task_info.get("reschedule_reason", "Rescheduled due to priority shift.")
                    
                    # Create audit logs
                    for i in range(1, r_cnt + 1):
                        diff = r_cnt - i
                        log_orig = orig_date + timedelta(days=i-1)
                        log_new = orig_date + timedelta(days=i)
                        
                        log = TaskChangeLog(
                            id=uuid.uuid4(),
                            task_id=task.id,
                            reason=f"Audit step {i}: {reason}",
                            original_target_date=log_orig,
                            new_target_date=log_new,
                            changed_at=datetime.now(timezone.utc) - timedelta(hours=(r_cnt - i) * 6)
                        )
                        db.add(log)
                    
                    # Ensure final date is correct
                    task.target_date = task_info["target_date"]
                    db.add(task)

        await db.commit()
        print("\n" + "="*50)
        print("SEEDING COMPLETED SUCCESSFULLY!")
        print("="*50)
        print("You can log in to the app with the following test credentials:")
        print("  Email:    coach_demo@example.com")
        print("  Password: demo12345")
        print("="*50 + "\n")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
