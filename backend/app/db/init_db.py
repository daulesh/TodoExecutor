import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from backend.app.core.config import settings
from backend.app.core.database import Base
from backend.app.models.models import User, Category, Task, TaskChangeLog

async def init_db():
    print(f"Initializing database at: {settings.DATABASE_URL}")
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Creating database tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created successfully.")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
