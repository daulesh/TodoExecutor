# System Flow Diagrams — TaskExecutor

> All key data flows and agent interactions visualized with Mermaid diagrams

---

## 1. Application Architecture Overview

```mermaid
graph TB
    subgraph Frontend["🌐 Next.js 16 Frontend"]
        WP[Welcome Page]
        Auth[Auth Pages\nLogin · Register]
        DB_Page[Dashboard\nToday's Tasks + AI Briefing]
        Tasks[Tasks Page\nCategories Accordion]
        Analytics[Analytics Page\nStats + AI Coach]
        TaskEdit[Task Edit Page\nAI Subtask Generator]
        ChatDrawer[AI Chat Drawer\nFloating Across All Pages]
    end

    subgraph Backend["⚙️ FastAPI Backend"]
        AuthAPI[/auth/\nJWT · OAuth]
        TasksAPI[/tasks/\nCRUD + Complete]
        CatsAPI[/categories/\nCRUD]
        AgentAPI[/agent/\nAI Endpoints]
    end

    subgraph Agents["🤖 Google ADK 2.0 Agent Fleet"]
        Analytics_A[Analytics Coach\nread-only]
        Planner_A[Task Planner\ncreates tasks]
        Reschedule_A[Rescheduler\noptimizes dates]
        Orchestrator_A[Orchestrator\nroutes requests]
    end

    DB[(PostgreSQL\nUsers · Tasks\nCategories\nTaskChangeLog)]
    Gemini[☁️ Gemini 2.5 Flash]

    Frontend -->|REST + JWT| Backend
    Backend --> DB
    AgentAPI --> Agents
    Agents --> DB
    Agents -->|ADK SDK| Gemini
```

---

## 2. User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant FE as Next.js Frontend
    participant API as FastAPI
    participant DB as PostgreSQL

    U->>FE: Visit /welcome
    FE->>FE: Check localStorage JWT
    alt JWT exists & valid
        FE->>U: Redirect to /dashboard
    else No JWT
        FE->>U: Show Welcome page
    end

    U->>FE: Click Login
    FE->>U: Show /login form
    U->>FE: Submit email + password
    FE->>API: POST /api/v1/auth/login
    API->>DB: SELECT user WHERE email=?
    DB-->>API: User row
    API->>API: Verify bcrypt password hash
    API-->>FE: {access_token, user}
    FE->>FE: Store JWT in localStorage
    FE->>U: Redirect to /dashboard
```

---

## 3. Task Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> Created: User creates task\n(manual or AI Planner)
    Created --> Scheduled: Has target_date\nis_completed=false

    Scheduled --> Overdue: target_date passes\nwithout completion
    Scheduled --> Completed: User checks off
    Overdue --> Rescheduled: User edits date\n(audit log entry created)
    Overdue --> Rescheduled: Rescheduler Agent\nauto-optimizes
    Rescheduled --> Scheduled: New target_date set
    Scheduled --> Rescheduled: User changes date\n(audit log required)

    Completed --> [*]: Task done ✓
```

---

## 4. Orchestrator Agent Routing Flow

```mermaid
flowchart TD
    User([👤 User Message\nvia Chat Drawer]) --> Orch[Orchestrator Agent\nGemini 2.5 Flash]

    Orch -->|Analyze intent| Decision{Intent\nClassification}

    Decision -->|"stats / trends /\ncompletion / coaching"| Ana[delegate_to_analytics_coach]
    Decision -->|"plan / organize /\nproject / prepare"| Plan[delegate_to_task_planner]
    Decision -->|"overdue / reschedule /\noverwhelmed / optimize"| Res[delegate_to_rescheduler]
    Decision -->|"hello / chat /\ngeneral question"| Direct[Direct Response\nNo tool call]

    Ana --> AnalyticsAgent[Analytics Coach Agent\n→ get_productivity_analytics\n→ Gemini coaching text]
    Plan --> PlannerAgent[Task Planner Agent\n→ get_user_categories\n→ create_category\n→ create_task × N]
    Res --> ReschedAgent[Rescheduler Agent\n→ get_chronically_rescheduled_tasks\n→ reschedule_task × N]

    AnalyticsAgent --> Response([📤 Response\nto Chat Drawer])
    PlannerAgent --> Response
    ReschedAgent --> Response
    Direct --> Response
```

---

## 5. Task Planner Agent Tool Loop

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as FastAPI /agent/plan
    participant ADK as ADK Runner
    participant Gemini as Gemini 2.5 Flash
    participant DB as PostgreSQL (own session)

    FE->>API: POST /agent/plan {message}
    API->>ADK: runner.run_async(user_message)
    ADK->>Gemini: Send message + tool definitions
    Gemini-->>ADK: Tool call: get_user_categories()
    ADK->>DB: SELECT categories WHERE user_id=?
    DB-->>ADK: [existing categories]
    ADK->>Gemini: Tool result: [categories JSON]

    Gemini-->>ADK: Tool call: create_category(title, color)
    ADK->>DB: INSERT categories (own session)
    DB-->>ADK: New category UUID
    ADK->>Gemini: Tool result: {status: created, id: uuid}

    loop For each planned task (4-7 tasks)
        Gemini-->>ADK: Tool call: create_task(title, date, category_id)
        ADK->>DB: INSERT tasks (own session)
        DB-->>ADK: New task UUID
        ADK->>Gemini: Tool result: {status: created}
    end

    Gemini-->>ADK: Final text response (plan summary)
    ADK-->>API: event.is_final_response()
    API-->>FE: {response: "Here's your plan..."}
```

---

## 6. Rescheduler Agent Flow

```mermaid
flowchart LR
    Start([Trigger:\n"Reschedule my overdue tasks"]) --> Fetch

    subgraph ReschedulerAgent["🔄 Rescheduler Agent"]
        Fetch[get_chronically_rescheduled_tasks\nScans: overdue + rescheduled before]
        Fetch --> Empty{Any\ntasks found?}
        Empty -->|No| Healthy[Return: Schedule is healthy! ✅]
        Empty -->|Yes| Analyze[Gemini analyzes each task\ncurrent_date + reschedule_count + history]
        Analyze --> Schedule[Calculate balanced\nnew target dates\nno overloading per day]
        Schedule --> Write[reschedule_task × N\nUpdates Task.target_date\nInserts TaskChangeLog]
        Write --> Summary[Return change summary\nwith reasons]
    end

    Healthy --> Done([Response to User])
    Summary --> Done
```

---

## 7. Database Schema (ERD)

```mermaid
erDiagram
    USERS {
        uuid id PK
        string username UK
        string email UK
        string password_hash
        string auth_provider
        string google_id
        bool is_active
        datetime created_at
        datetime updated_at
    }

    CATEGORIES {
        uuid id PK
        uuid user_id FK
        string title
        string color_hex
        string icon
        datetime created_at
    }

    TASKS {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        string title
        text description
        date target_date
        int estimated_duration_minutes
        time start_time
        time end_time
        bool is_completed
        int actual_duration_minutes
        text completion_notes
        datetime completed_at
        datetime created_at
        datetime updated_at
    }

    TASK_CHANGE_LOG {
        uuid id PK
        uuid task_id FK
        text reason
        date original_target_date
        date new_target_date
        datetime changed_at
    }

    USERS ||--o{ CATEGORIES : "owns"
    USERS ||--o{ TASKS : "owns"
    CATEGORIES ||--o{ TASKS : "groups"
    TASKS ||--o{ TASK_CHANGE_LOG : "has history"
```

---

## 8. Session Isolation Pattern (Agents vs FastAPI)

```mermaid
graph TB
    subgraph Request["FastAPI Request Lifecycle"]
        FReq[Incoming Request] --> GetDB[get_db dependency\nyields session A]
        GetDB --> Endpoint[Endpoint handler]
        Endpoint --> Commit[session A.commit]
        Commit --> FResp[Response]
    end

    subgraph AgentTools["ADK Agent Tool Calls (isolated sessions)"]
        Tool1[create_category\nSessionLocal → session B\ncommit → close]
        Tool2[create_task #1\nSessionLocal → session C\ncommit → close]
        Tool3[create_task #2\nSessionLocal → session D\ncommit → close]
    end

    Endpoint -->|asyncio.gather| Tool1
    Endpoint -->|asyncio.gather| Tool2
    Endpoint -->|asyncio.gather| Tool3

    style Tool1 fill:#1e3a5f,color:#fff
    style Tool2 fill:#1e3a5f,color:#fff
    style Tool3 fill:#1e3a5f,color:#fff
```

> **Why this matters:** SQLAlchemy `AsyncSession` is not thread/task-safe. If multiple ADK tools shared the same session, concurrent flushes would cause `IllegalStateChangeError`. Independent sessions eliminate this entirely.

---

## 9. Frontend Page Navigation Map

```mermaid
graph LR
    Welcome[/welcome\nLanding Page] -->|Login| Login[/login]
    Welcome -->|Register| Register[/register]
    Login -->|JWT stored| Dashboard[/ Dashboard\nToday's Tasks]
    Register -->|JWT stored| Dashboard

    Dashboard --> TaskEdit[/tasks/taskId\nEdit + AI Subtasks]
    Dashboard --> DateView[/date/date\nDate-specific Tasks]
    Dashboard --> Tasks[/tasks\nAll by Category]
    Dashboard --> Analytics[/analytics\nStats + Coach]
    Dashboard --> NewTask[/tasks/new\nCreate Task]

    Tasks --> TaskEdit
    DateView --> TaskEdit

    subgraph AI["AI Interactions (available on all pages)"]
        ChatDrawer[AI Chat Drawer\nfloating button]
    end
```
