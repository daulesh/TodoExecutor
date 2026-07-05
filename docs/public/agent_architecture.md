# Agent Architecture — TaskExecutor AI Fleet

> Deep-dive into all four Google ADK 2.0 agents powering TaskExecutor

---

## Overview

TaskExecutor runs a **fleet of four specialized AI agents**, each built with Google ADK 2.0 and powered by Gemini 2.5 Flash. Each agent:

- Has a well-defined **single responsibility**
- Manages its **own database session** (no shared-session concurrency issues)
- Exposes **typed Python async tool functions** registered with ADK
- Streams responses via ADK's `runner.run_async()`
- Is called via a non-blocking `asyncio.run_in_executor` wrapper for sync Gemini SDK calls

---



## Agent 1: Analytics Coach Agent

**File:** `backend/app/agents/analytics_agent.py`  
**Endpoint:** `POST /api/v1/agent/insights`  
**Trigger:** Analytics & Export page → "AI Coach" card; also reachable via Orchestrator chat

### Purpose

Read-only productivity analyst. Queries the user's task database and synthesizes a coaching report using Gemini.

### Tool: `get_productivity_analytics()`

This single tool performs multiple async DB queries to gather:


| Metric                 | SQL Query                                             |
| ---------------------- | ----------------------------------------------------- |
| Total tasks            | `COUNT(Task.id) WHERE user_id = ?`                    |
| Completed tasks        | `COUNT WHERE is_completed = True`                     |
| Overdue tasks          | `COUNT WHERE target_date < today AND NOT completed`   |
| Per-category breakdown | Loops each Category, counts total + completed         |
| Reschedule count       | `COUNT(TaskChangeLog.id) JOIN Task WHERE user_id = ?` |
| Completion rate        | `completed / total * 100`                             |


Returns all data as a single JSON string to the agent.

### Agent Instruction

```
You are an expert personal productivity coach. You have access to the user's real-time task metrics.
Always call get_productivity_analytics first, then provide detailed insights based on the actual data...
```



### Key Design Decisions

- **Read-only** — never mutates any data
- Receives the FastAPI `db` session as a parameter (passed in by the endpoint handler)
- No parallel tool calls — single sequential read avoids any session conflicts

---



## Agent 2: Task Planner Agent

**File:** `backend/app/agents/planner_agent.py`  
**Endpoint:** `POST /api/v1/agent/plan`  
**Trigger:** Tasks page → "AI Goal & Task Planner" card; also reachable via Orchestrator chat

### Purpose

Mutation agent that creates categories and tasks from a natural language goal description.

### Tools



#### `get_user_categories()`

- Lists all existing categories for the user
- Returns JSON: `[{id, title, color_hex}, ...]`
- Agent calls this first to avoid creating duplicates



#### `create_category(title, color_hex)`

- Creates a new category if one matching the goal doesn't exist
- Checks for duplicates by title before inserting
- Returns the new or existing category's UUID



#### `create_task(title, description, target_date_str, category_id_str)`

- Creates a structured task linked to a category
- Target dates are spread across days starting from today
- Returns the new task's UUID and title



### Agent Instruction Flow

```
1. Call get_user_categories → check existing
2. If needed, call create_category → get category_id
3. Break goal into 4–7 tasks
4. Call create_task for each task with spread target dates
5. Return a human-
```

**File:** `backend/app/agents/rescheduler_agent.py`  
**Endpoint:** `POST /api/v1/agent/reschedule`  
**Trigger:** AI Chat → *"Reschedule my overdue tasks"* or direct endpoint call

```
readable plan summary
```



### Key Design Decisions

- Each tool creates **its own** `SessionLocal()` and commits independently
- Prevents `PendingRollbackError` from ADK's parallel tool execution
- Category deduplication prevents messy category proliferation

---



## Agent 3: Rescheduler Agent

### Purpose

Autonomous schedule optimizer. Scans for problematic tasks and redistributes them into a healthy future schedule.

### Tools



#### `get_chronically_rescheduled_tasks()`

Returns all incomplete tasks that are either:

- **Overdue** (`target_date < today`)
- **Previously rescheduled** (have ≥ 1 `TaskChangeLog` entry)

Each task in the response includes:

```json
{
  "id": "uuid",
  "title": "...",
  "current_target_date": "2026-06-28",
  "reschedule_count": 3,
  "is_overdue": true,
  "history": [{"original": "...", "new": "...", "reason": "..."}]
}
```



#### `reschedule_task(task_id, new_target_date_str, reason)`

- Updates `Task.target_date` to the new date
- Inserts a `TaskChangeLog` row with:
  - `original_target_date` (old value)
  - `new_target_date` (new value)
  - `reason` (AI-generated explanation)
- Returns success confirmation



### Agent Instruction Flow

```
1. Call get_chronically_rescheduled_tasks
2. If empty → notify user schedule is healthy
3. For each flagged task → determine realistic new date
   - Spread tasks across future days (no overloading)
   - Consider reschedule_count (more = push further)
4. Call reschedule_task for each
5. Return summary of all changes made
```



### Key Design Decisions

- Uses `selectinload(Task.change_history)` for efficient eager loading
- Creates **independent session per tool call** — safe for ADK parallel execution
- AI reason is meaningful (e.g. "Task overdue by 7 days; redistributed to avoid backlog overload")

---



## Agent 4: Orchestrator Agent (Master Coordinator)

**File:** `backend/app/agents/orchestrator_agent.py`  
**Endpoint:** `POST /api/v1/agent/chat`  
**Trigger:** AI Chat Drawer (floating ✨ button, available on every page)

### Purpose

The master conversational AI that routes user messages to sub-agents or handles general chat directly.

### Routing Tools



#### `delegate_to_analytics_coach(query)`

- Calls `run_analytics_agent(db=session, user_id=..., user_message=query)`
- Creates a fresh `SessionLocal()` for the analytics session
- Returns the analytics agent's full response text



#### `delegate_to_task_planner(query)`

- Calls `run_planner_agent(user_id=..., user_message=query)`
- The planner manages its own sessions internally
- Returns the planner's summary text



#### `delegate_to_rescheduler(query)`

- Calls `run_rescheduler_agent(user_id=..., user_message=query)`
- Returns the rescheduler's change summary



### Routing Logic (Agent Instruction)

```
- Analytics keywords (stats, productivity, completion, trends) → delegate_to_analytics_coach
- Planning keywords (plan, organize, prepare, schedule, project) → delegate_to_task_planner
- Rescheduling keywords (overdue, overwhelmed, reschedule, optimize) → delegate_to_rescheduler
- Greetings/general chat → respond directly (no tool call)
```



### Key Design Decisions

- **Single entry point** for all AI interaction — simplifies the frontend
- Sub-agent responses are returned verbatim — preserves formatting
- Orchestrator is stateless per request — future multi-turn support can be added via `InMemorySessionService`

---



## Common Technical Patterns



### Session Isolation Pattern

Every mutating tool creates and disposes of its own session:

```python
async def create_task(...) -> str:
    async with SessionLocal() as session:       # new session
        new_task = Task(...)
        session.add(new_task)
        await session.commit()                  # committed independently
    # session closed here
```

This prevents `PendingRollbackError` when ADK calls multiple tools in parallel.

### Non-Blocking Gemini Pattern

Direct Gemini SDK calls (briefing, subtasks) use thread pool offloading:

```python
loop = asyncio.get_event_loop()
result = await loop.run_in_executor(None, partial(_sync_gemini_generate, prompt))
```

This prevents the synchronous SDK from freezing the uvicorn event loop.

### ADK Runner Pattern (all agents)

```python
session_service = InMemorySessionService()
runner = Runner(agent=agent, app_name="...", session_service=session_service)
await session_service.create_session(...)

async for event in runner.run_async(...):
    if event.is_final_response():
        final_text = event.content.parts[0].text
```

---



## Agent Comparison Table


|                     | Analytics           | Planner              | Rescheduler          | Orchestrator        |
| ------------------- | ------------------- | -------------------- | -------------------- | ------------------- |
| **Read/Write**      | Read-only           | Write                | Read + Write         | Delegates           |
| **Tools count**     | 1                   | 3                    | 2                    | 3                   |
| **DB Session**      | Parameter (FastAPI) | Own per tool         | Own per tool         | Own per delegate    |
| **Gemini calls**    | 1 (via ADK)         | Multiple (tool loop) | Multiple (tool loop) | 1 + sub-agent calls |
| **Avg latency**     | 5–15s               | 15–30s               | 10–25s               | 5–30s               |
| **Primary trigger** | Analytics page      | Tasks page           | Chat / direct        | Chat Drawer         |


