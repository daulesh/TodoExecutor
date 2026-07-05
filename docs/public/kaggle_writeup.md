# TaskExecutor — Kaggle Concierge Agents Capstone Writeup

**Competition:** [Vibecoding Agents Capstone Project — Concierge Agents Track](https://www.kaggle.com/competitions/vibecoding-agents-capstone-project/overview)

---

## Project Title

**TaskExecutor: A Personal AI Concierge Agent Suite for Autonomous Productivity Management**

---

## Problem Statement

Modern individuals are overwhelmed by the volume, complexity, and time-pressure of personal task management. Traditional to-do apps are passive — they store what you tell them and remind you when you ask. They don't *think*. They don't *adapt*. They don't *notice* when you're falling behind.

The result: chronically rescheduled tasks, productivity guilt, missed deadlines, and wasted mental energy figuring out what to do next.

**TaskExecutor solves this** by deploying a fleet of specialized AI Concierge Agents that actively manage your schedule, analyze your patterns, and adapt your plan — all while keeping every piece of personal data on your own infrastructure.

---



## Solution Overview

TaskExecutor is a full-stack personal productivity application with **four purpose-built AI agents** powered by Google ADK 2.0 and Gemini 2.5 Flash. Each agent has a clear domain and specialization:


| Agent               | Role                                                      | Trigger                    |
| ------------------- | --------------------------------------------------------- | -------------------------- |
| **Analytics Coach** | Analyzes your productivity metrics and coaches you        | Analytics page, Chat       |
| **Task Planner**    | Converts high-level goals into structured task breakdowns | Tasks page, Chat           |
| **Rescheduler**     | Autonomously detects and optimizes overdue/delayed tasks  | Chat, Direct endpoint      |
| **Orchestrator**    | Routes natural language messages to the right sub-agent   | AI Chat Drawer (all pages) |


---



## Concierge Agent Design Philosophy

### 1. Personal Information Stays Personal

All user data — tasks, categories, schedules, and completion logs — is stored in a **self-hosted PostgreSQL database**. The AI agents receive only:

- Aggregated statistics (counts, dates, completion rates)
- Task titles and descriptions the user explicitly wrote
- Reschedule history the user explicitly created

**No task content is ever sent to external analytics services or third-party storage.**

The Gemini API receives only the structured prompt context needed to generate a response. The user controls the API key and can rotate or revoke it at any time.

### 2. Agents as Silent Partners, Not Noisy Assistants

The agents operate in the background and surface insights at exactly the right moment:

- **Morning briefing** appears when you open the dashboard — not as a notification interruption
- **Rescheduler** only runs when triggered — it doesn't autonomously change your data without permission
- **Subtask Generator** only triggers when you explicitly request it on a specific task



### 3. Audit Trail by Design

Every AI-initiated or user-initiated schedule change creates an immutable `TaskChangeLog` entry with:

- Original date
- New date
- Reason (AI-generated or user-written)
- Timestamp

This ensures complete transparency — you always know *why* a task was moved and *when*.

---



## Technical Architecture



### Stack


| Layer             | Technology                     | Why                                         |
| ----------------- | ------------------------------ | ------------------------------------------- |
| **Frontend**      | Next.js 16, MUI, Framer Motion | SSR + beautiful responsive UI               |
| **Backend**       | FastAPI (Python 3.11)          | High-performance async API                  |
| **Database**      | PostgreSQL + SQLAlchemy async  | Robust relational data with async support   |
| **Agent Runtime** | Google ADK 2.0                 | Structured tool-calling, session management |
| **LLM**           | Gemini 2.5 Flash               | Fast, cost-effective, tool-calling capable  |
| **Auth**          | JWT (HS256) + bcrypt           | Secure, stateless authentication            |




### Agent Tool Architecture

Each agent defines Python async functions as **tools** that ADK registers and calls when Gemini decides they're needed:

```python
# Example: Planner Agent tools
async def get_user_categories() -> str:      # Read existing categories
async def create_category(title, color) -> str:  # Create if new
async def create_task(title, date, cat_id) -> str:  # Create each task
```

The ADK `Runner` manages the tool-call loop:

1. User message sent to Gemini with tool schemas
2. Gemini returns tool call requests
3. ADK executes the tools (database operations)
4. Results returned to Gemini
5. Gemini generates the final response
6. Process repeats until `is_final_response()`



### Critical Engineering Decision: Session Isolation

SQLAlchemy `AsyncSession` is not thread-safe. ADK may call multiple tools concurrently via `asyncio.gather()`. If tools shared a session, concurrent flushes trigger `IllegalStateChangeError`.

**Solution:** Each tool function creates and disposes of its own `SessionLocal()` context:

```python
async def create_task(...) -> str:
    async with SessionLocal() as session:  # Independent session
        session.add(Task(...))
        await session.commit()             # Safe isolated commit
```

This architecture scales to any number of parallel tool calls without conflicts.

### Critical Engineering Decision: Non-Blocking Event Loop

The synchronous Google GenAI SDK (`client.models.generate_content()`) blocks the calling thread. Called directly inside FastAPI's async handlers, this freezes the entire uvicorn event loop — **blocking all other requests including login**.

**Solution:** Offload to Python's ThreadPoolExecutor:

```python
loop = asyncio.get_event_loop()
result = await loop.run_in_executor(
    None,
    partial(_sync_gemini_generate, prompt)
)
```

This keeps the event loop free for other requests while the Gemini call executes in a thread.

---



## Concierge Agent Use Cases



### 1. The Overwhelmed Professional

*"I have 12 tasks overdue and no idea where to start."*

→ Opens AI Chat, types: *"I'm overwhelmed, reschedule my overdue tasks"*  
→ Orchestrator routes to Rescheduler Agent  
→ Agent identifies all overdue tasks, distributes them across the next 5 days at a pace of 2-3/day  
→ Returns a detailed summary of every change made  

### 2. The Goal-Setter

*"I want to prepare for a Kaggle machine learning competition starting Monday."*

→ Opens AI Chat or Task Planner  
→ Types: *"Plan my Kaggle competition prep over 3 weeks"*  
→ Planner creates: Category "Kaggle Comp" + 6 structured tasks:  

- EDA and data understanding (Day 1)  
- Baseline model (Day 3)  
- Feature engineering (Day 5)  
- Model tuning (Day 8)  
- Cross-validation strategy (Day 12)  
- Submission preparation (Day 18)



### 3. The Self-Analyst

*"Am I actually making progress or just busy?"*

→ Opens Analytics page → AI Coach  
→ Types: *"Give me an honest assessment of my productivity"*  
→ Agent returns: completion rate per category, top rescheduled tasks, streak analysis, and specific coaching recommendations

### 4. The Task Breakdown Seeker

*"I have a big task: 'Submit conference paper' — I don't know where to start."*

→ Opens the task edit page  
→ Clicks "Generate Actionable Subtasks"  
→ AI returns:

- Research related work
- Write abstract and introduction
- Complete methodology section
- Create evaluation experiments
- Final proofreading and formatting

→ Clicks "+ Add to Desc" for each step → saves → structured task is ready

---



## What Makes This a Concierge Agent Application

The Kaggle Concierge Agents track specifically calls for agents that:

> *"streamline and simplify people's lives... safe and secure agents can free time for things that really matter"*

TaskExecutor addresses this by:

1. **Streamlining**: The Orchestrator eliminates navigation friction — one chat window handles planning, analysis, and scheduling autonomously
2. **Simplifying**: Instead of manually juggling a task list, the AI does the cognitive work of deciding *when* tasks should be done and *what order* makes sense
3. **Safety**: All personal data stays in the user's own database. Gemini sees only what's needed for each specific query
4. **Securing**: JWT authentication with per-user data isolation ensures one user can never access another user's data
5. **Freeing time**: The ~30 minutes per week typically spent manually reorganizing a task list is done in 10 seconds by asking *"reschedule my overdue tasks"*

---



## Innovation Highlights



### Multi-Agent Orchestration

TaskExecutor implements a true **multi-agent system** where a master Orchestrator dynamically delegates to specialized sub-agents. This mirrors production-grade agentic architectures used in enterprise AI systems.

### Audit-First Design

The `TaskChangeLog` table ensures every schedule change — whether by the user or by the AI — is permanently logged with context. This is essential for trust in AI-assisted applications.

### Async-Safe Agent Tool Pattern

The per-tool session isolation pattern solves a real-world engineering challenge that many async agent implementations encounter. This pattern is publishable as a best practice for ADK + SQLAlchemy integrations.

### Thread Pool + Event Loop Decoupling

The `run_in_executor` pattern for synchronous SDK calls prevents event loop starvation — a common pitfall when integrating synchronous AI SDKs into async web frameworks.

---



## Results & Demo



### Demo Account

- **Email:** `coach_demo@example.com`
- **Password:** `demo12345`
- Pre-seeded with realistic task history across multiple categories



### Live Features Demonstrated

1. ✅ Natural language goal → structured task plan (Planner Agent)
2. ✅ Personalized daily briefing on every dashboard load
3. ✅ Real-time productivity analytics with coaching (Analytics Agent)
4. ✅ Autonomous overdue task rescheduling (Rescheduler Agent)
5. ✅ Unified conversational interface routing to all agents (Orchestrator)
6. ✅ One-click AI subtask generation for any task
7. ✅ Full rescheduling audit trail per task

---



## Improvements & Future Work

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for a detailed roadmap.

Key upcoming features:

- Voice input via Web Speech API
- Mobile app (React Native)
- Multi-user household/team sharing
- Calendar integration (Google Calendar sync)
- Proactive notifications (*"You have 3 tasks due tomorrow — shall I prioritize them?"*)

---



## Repository Structure

```
TaskExecutor/
├── README.md                          # Project overview + quick start
├── backend/                           # FastAPI + ADK agents
│   ├── app/agents/                    # All 4 agent implementations
│   ├── app/api/v1/endpoints/          # REST API routes
│   └── requirements.txt
├── frontend/                          # Next.js 16 app
│   └── src/app/(dashboard)/           # Main app pages
└── docs/
    ├── presentation-demo/             # This documentation suite
    ├── erd.md                         # Database ERD
    ├── api_spec.yaml                  # OpenAPI spec
    └── flow_diagram.md               # System flow diagrams
```

---

*Built for the Kaggle Vibecoding Agents Capstone — Concierge Agents Track*  
*Powered by Google ADK 2.0 · Gemini 2.5 Flash · FastAPI · Next.js 16*