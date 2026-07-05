# TaskExecutor: AI Agent Fleet Guide

This guide documents all **six AI-powered endpoints** built into TaskExecutor using **Google Agent Development Kit (ADK) 2.0** and **Gemini 2.5 Flash**. It covers the architecture, each agent's role, and how to interact with the endpoints.

---

## Overview

TaskExecutor ships a fleet of four specialized AI agents exposed through six endpoints:

| Endpoint | Agent | Type | Description |
|---|---|---|---|
| `GET /agent/briefing` | Daily Briefing | Gemini direct | Personalized morning greeting based on today's tasks |
| `POST /agent/suggest-subtasks` | Subtask Generator | Gemini direct | Breaks a single task into actionable steps |
| `POST /agent/insights` | Analytics Coach | ADK Agent | Productivity coaching from real DB metrics |
| `POST /agent/plan` | Task Planner | ADK Agent | Creates categories + tasks from a natural language goal |
| `POST /agent/reschedule` | Rescheduler | ADK Agent | Autonomously redistributes overdue/delayed tasks |
| `POST /agent/chat` | Orchestrator | ADK Agent | Routes messages to the right sub-agent |

---

## Tech Stack & ADK 2.0 Flow

1. **Framework:** Google Agent Development Kit (ADK) 2.0
2. **Model:** `gemini-2.5-flash`
3. **Reasoning Loop:** The ADK agents use an **Asynchronous Runner** (`Runner.run_async()`) and an `InMemorySessionService` to parse requests, call tools, and generate responses.
4. **Tools Integration:** Each agent exposes typed Python async functions. ADK inspects parameters, docstrings, and return types to dynamically call database operations via SQLAlchemy.
5. **Non-blocking pattern:** All synchronous Gemini SDK calls are offloaded via `asyncio.run_in_executor()` to prevent blocking the uvicorn event loop.

```
              ┌──────────────────────────────────┐
              │    FastAPI /api/v1/agent/*       │
              └────────────────┬─────────────────┘
                               │
                               ▼
            ┌──────────────────────────────────────┐
            │   ADK 2.0 Agent (Runner.run_async)   │
            └──────────────────┬───────────────────┘
                               │
                   Tool call? ─┼──► Python async tool fn()
                               │                  │
                               │                  ▼
                               │        PostgreSQL via SQLAlchemy
                               │        (own session per tool call)
                               │                  │
                               ◄──────────────────┘
                               │
                               ▼
            ┌──────────────────────────────────────┐
            │      Gemini generates final text     │
            └──────────────────────────────────────┘
```

---

## Configuration

Add your Gemini API key to the backend `.env` file:

```bash
GEMINI_API_KEY=your-actual-api-key-here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT=120
```

> If no API key is set, all agent endpoints return a development mock response without crashing.

---

## Endpoint 1 — Daily Briefing

- **Route:** `GET /api/v1/agent/briefing`
- **Authentication:** Bearer JWT required
- **Pattern:** Direct Gemini call (not ADK agent)

### What it does
Reads today's task count, overdue count, completed-yesterday count, and upcoming task titles from the database, then asks Gemini to generate a personalized morning greeting.

### In-memory Cache
The briefing is cached per prompt string to avoid redundant Gemini calls within the same session. The cache key includes the date and task snapshot; a new day or task state change triggers a fresh generation.

### Sample Response
```json
{
  "briefing": "Good morning! You have 4 tasks lined up today including 'Kaggle EDA script' — tackle that first to keep your 3-day streak alive. 2 tasks are overdue — the Rescheduler can help you redistribute them."
}
```

---

## Endpoint 2 — Suggest Subtasks

- **Route:** `POST /api/v1/agent/suggest-subtasks`
- **Authentication:** Bearer JWT required
- **Pattern:** Direct Gemini call (not ADK agent)

### Request Body
```json
{
  "title": "Submit conference paper",
  "description": "NeurIPS 2026 deadline in 3 weeks"
}
```

### What it does
Sends the task title and description to Gemini with a prompt requesting 3–5 concrete, actionable subtasks. Returns them as a list for the user to selectively append to the task description.

### Sample Response
```json
{
  "subtasks": [
    "Research and review related work from NeurIPS 2024–2025",
    "Write abstract and introduction section",
    "Complete methodology and experiments section",
    "Run final evaluation and collect results",
    "Proofread, format, and submit via CMT"
  ]
}
```

---

## Endpoint 3 — Analytics Coach (ADK Agent)

- **Route:** `POST /api/v1/agent/insights`
- **Authentication:** Bearer JWT required
- **Pattern:** ADK Agent with 1 tool

### Request Body
```json
{
  "message": "Give me coaching advice. What categories should I focus on?"
}
```

### Tool: `get_productivity_analytics()`
Queries the database to return:
- Total/completed/overdue task counts
- Completion rate percentage
- Per-category breakdown (completed vs total)
- Total reschedule count

All data is sent as a single JSON string to Gemini, ensuring the coaching response is grounded in real facts.

### Sample Response
```json
{
  "response": "Your completion rate is 75.3%, which is strong! However, your 'Health' category has only 2 of 9 tasks completed. You've rescheduled 12 times this week — consider reducing daily task load from 5 to 3 to avoid chronic rescheduling."
}
```

---

## Endpoint 4 — Task Planner (ADK Agent)

- **Route:** `POST /api/v1/agent/plan`
- **Authentication:** Bearer JWT required
- **Pattern:** ADK Agent with 3 tools (multi-step database mutation)

### Request Body
```json
{
  "message": "Plan my preparation for a Kaggle ML competition over 3 weeks"
}
```

### Tools
1. `get_user_categories()` — checks existing categories to avoid duplicates
2. `create_category(title, color_hex)` — creates a new category if needed
3. `create_task(title, description, target_date_str, category_id_str)` — creates each individual task

### Agent Instruction Flow
1. Call `get_user_categories` → check existing
2. If goal needs a new category → `create_category`
3. Break goal into 4–7 structured tasks
4. Call `create_task` for each with spread target dates
5. Return a human-readable plan summary

### Sample Response
```json
{
  "response": "I've created a 'Kaggle ML Prep' category and added 6 tasks:\n1. EDA and data understanding (Jul 7)\n2. Baseline model (Jul 9)\n3. Feature engineering (Jul 11)\n4. Model tuning (Jul 14)\n5. Cross-validation strategy (Jul 18)\n6. Submission preparation (Jul 24)"
}
```

> **Note:** This agent mutates the database. After it completes, refresh the Tasks page to see the new category and tasks.

---

## Endpoint 5 — Rescheduler (ADK Agent)

- **Route:** `POST /api/v1/agent/reschedule`
- **Authentication:** Bearer JWT required
- **Pattern:** ADK Agent with 2 tools (read + write)

### Request Body
```json
{
  "message": "Optimize my overdue and chronically rescheduled tasks."
}
```

### Tools

#### `get_chronically_rescheduled_tasks()`
Returns all incomplete tasks that are overdue or have been rescheduled before. Each result includes the reschedule count and full history.

#### `reschedule_task(task_id, new_target_date_str, reason)`
- Updates `Task.target_date`
- Inserts a `TaskChangeLog` entry with the AI-generated reason
- Returns success confirmation

### Sample Response
```json
{
  "response": "I've redistributed 5 overdue tasks:\n- 'Kaggle EDA' → Jul 7 (was Jun 28, rescheduled 3x)\n- 'Write report' → Jul 8 (overdue 9 days)\n- 'Fix auth bug' → Jul 9\n- 'Review PRs' → Jul 10\n- 'Update docs' → Jul 11\nAll changes are logged in your task audit history."
}
```

---

## Endpoint 6 — Orchestrator Chat (ADK Agent)

- **Route:** `POST /api/v1/agent/chat`
- **Authentication:** Bearer JWT required
- **Pattern:** ADK Master Agent with 3 delegation tools

### Request Body
```json
{
  "message": "I'm overwhelmed — reschedule my overdue tasks and tell me how I'm doing"
}
```

### Routing Tools
1. `delegate_to_analytics_coach(query)` — routes analytics/coaching intent
2. `delegate_to_task_planner(query)` — routes planning/goal intent
3. `delegate_to_rescheduler(query)` — routes reschedule/overwhelmed intent

### Routing Heuristics (built into agent instruction)
| Keywords | Agent |
|---|---|
| stats, productivity, completion, trends, coaching | Analytics Coach |
| plan, organize, prepare, schedule, project, goal | Task Planner |
| overdue, overwhelmed, reschedule, optimize, behind | Rescheduler |
| hello, help, what can you do (general chat) | Orchestrator directly |

---

## What the Agents Deliver

1. **Fact-Based Analysis:** The Analytics Agent cannot hallucinate user statistics — all data comes from SQL tool outputs.
2. **Autonomous Scheduling:** The Rescheduler makes real database changes with audit-logged reasons.
3. **Goal → Structure:** The Planner transforms vague intentions into dated, categorized tasks.
4. **Single Interface:** The Orchestrator eliminates navigation friction — one chat window handles all AI interactions.
5. **Transparency:** Every AI-initiated schedule change is logged in `task_change_log` with a human-readable reason.
