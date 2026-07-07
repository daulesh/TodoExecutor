# TaskExecutor — AI-Powered Personal Productivity Suite

> **Kaggle Concierge Agents Capstone** · Built with Google ADK 2.0, FastAPI, Next.js 16, PostgreSQL

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Google ADK](https://img.shields.io/badge/Google%20ADK-2.0-4285F4?logo=google)](https://google.github.io/adk-docs/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-8B5CF6?logo=google)](https://ai.google.dev)

---

## What is TaskExecutor?

**TaskExecutor** is a secure, personal AI Concierge Agent system that transforms how individuals manage their daily tasks, projects, and time. It combines a beautiful modern web interface with a fleet of **four specialized AI agents** — all powered by Google's Gemini 2.5 Flash via Google ADK 2.0.

Rather than a passive to-do list, TaskExecutor **thinks alongside you**:
- It **plans** your goals into actionable tasks
- It **analyzes** your productivity patterns and coaches you
- It **reschedules** overdue items autonomously
- It **converses** with you in natural language to get anything done

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📅 **Smart Task Management** | Create, categorize, schedule tasks with full rescheduling audit trail |
| 🤖 **AI Planning Agent** | Describe a goal — AI creates categories and a structured task breakdown |
| 📊 **Analytics Coach Agent** | Real-time insights on completion rates, streaks, and overdue patterns |
| 🔄 **Rescheduler Agent** | Autonomously detects and optimizes chronically delayed tasks |
| 💬 **Conversational Orchestrator** | Single chat interface routes to the right sub-agent automatically |
| 🌅 **AI Daily Briefing** | Personalized morning greeting with today's stats on every dashboard load |
| ✅ **AI Subtask Generator** | Breaks any task into 3–5 actionable steps with one click |
| 📈 **Analytics Dashboard** | Category breakdowns, reschedule logs, completion percentages |
| 📤 **JSON Data Export** | Full task and category export for portability |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                   │
│  Dashboard · Tasks · Analytics · AI Chat Drawer          │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JWT Auth)
┌──────────────────────▼──────────────────────────────────┐
│              FastAPI Backend (Python 3.11)               │
│  Auth · Tasks · Categories · Analytics · Agent Routes    │
└──────────────┬───────────────────────┬──────────────────┘
               │                       │
┌──────────────▼──────┐   ┌────────────▼────────────────┐
│  PostgreSQL Database │   │   Google ADK 2.0 Agent Fleet │
│  Users · Tasks ·    │   │  ├─ Analytics Coach          │
│  Categories ·       │   │  ├─ Task Planner             │
│  TaskChangeLog      │   │  ├─ Rescheduler              │
└─────────────────────┘   │  └─ Orchestrator (Master)    │
                          └──────────────┬───────────────┘
                                         │
                          ┌──────────────▼───────────────┐
                          │     Gemini 2.5 Flash (API)    │
                          └──────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/TodoExecutor.git
cd TodoExecutor
```

---

### Option A: Docker (Recommended)

Runs PostgreSQL, the FastAPI backend, and the Next.js frontend together with a single command.

#### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+
- Google Gemini API Key ([get one here](https://aistudio.google.com/apikey))

#### 1. Configure environment

```bash
copy .env.example .env         # Windows
# cp .env.example .env         # macOS / Linux
```

Edit `.env` in the project root. At minimum, set your Gemini key:

```env
GEMINI_API_KEY=your-gemini-api-key-here
SECRET_KEY=your-strong-secret-key-here
```

Other variables are optional — defaults work for local use:

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `admin` / `admin` / `todo_dev` | Database credentials |
| `POSTGRES_PORT` | `5432` | Host port for PostgreSQL |
| `BACKEND_PORT` | `8000` | Host port for the API |
| `FRONTEND_PORT` | `3000` | Host port for the web app |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `GOOGLE_CLIENT_ID` | *(empty)* | Optional Google OAuth client ID |

#### 2. Start all services

```bash
docker compose up -d --build
```

Docker Compose will:
- Start **PostgreSQL 16** and wait until it is healthy
- Build and start the **backend** (tables are created automatically on first boot)
- Build and start the **frontend** (proxies `/api/v1` to the backend over the internal network)

#### 3. Open the app

| Service | URL |
|---|---|
| **Web app** | http://localhost:3000 |
| **API docs** | http://localhost:8000/docs |
| **Health check** | http://localhost:8000/health |

Ports follow `FRONTEND_PORT` and `BACKEND_PORT` in your `.env` if you changed them.

#### Useful Docker commands

```bash
# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove database volume (fresh start)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build
```

#### Optional: seed the demo account

The demo user is not created automatically in Docker. Either **register** at http://localhost:3000/register, or seed from your host machine (requires Python 3.11+):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux
pip install -r requirements-dev.txt

# Match POSTGRES_* values from the root .env
set DATABASE_URL=postgresql+asyncpg://admin:admin@localhost:5432/todo_dev   # Windows
# export DATABASE_URL=postgresql+asyncpg://admin:admin@localhost:5432/todo_dev   # macOS / Linux
python scripts/seed_data.py
```

---

### Option B: Local Development

#### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (running locally)
- Google Gemini API Key ([get one here](https://aistudio.google.com/apikey))

#### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install dependencies (includes alembic, pytest, dev tooling)
pip install -r requirements-dev.txt

# Set up environment variables
copy .envexample .env         # Windows
# cp .envexample .env         # macOS / Linux
```

Edit `.env` and fill in:

```env
DATABASE_URL=postgresql+asyncpg://your_user:your_password@localhost:5432/todo_dev
JWT_SECRET_KEY=your-strong-secret-key-here
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT=120
```

Start the backend:

```bash
uvicorn app.main:app --reload
# API running at: http://localhost:8000
# Interactive docs: http://localhost:8000/docs
```

> On first startup, SQLAlchemy automatically creates all database tables.

#### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App running at: http://localhost:3000
```

---

## 🗄️ Database Setup

**Using Docker?** PostgreSQL is provisioned automatically by `docker compose` — skip this section.

For local development, create a PostgreSQL database before starting the backend:

```sql
CREATE DATABASE todo_dev;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE todo_dev TO your_user;
```

The backend will create all tables automatically on first startup via SQLAlchemy's `create_all`.

---

## 🔑 Demo Account

A demo account is pre-seeded for testing:

| Field | Value |
|---|---|
| **Email** | `coach_demo@example.com` |
| **Password** | `demo12345` |

---

## 📂 Project Structure

```
TaskExecutor/
├── docker-compose.yml           # Full-stack Docker setup
├── .env.example                 # Root env template for Docker Compose
├── backend/
│   ├── app/
│   │   ├── agents/              # AI Agent implementations (ADK 2.0)
│   │   │   ├── analytics_agent.py
│   │   │   ├── planner_agent.py
│   │   │   ├── rescheduler_agent.py
│   │   │   └── orchestrator_agent.py
│   │   ├── api/v1/endpoints/    # FastAPI route handlers
│   │   │   ├── agent.py         # All AI agent endpoints
│   │   │   ├── auth.py
│   │   │   ├── tasks.py
│   │   │   ├── categories.py
│   │   │   └── analytics.py
│   │   ├── core/                # Config, database, security
│   │   ├── models/              # SQLAlchemy ORM models
│   │   └── schemas/             # Pydantic request/response schemas
│   ├── .envexample              # Environment variable template
│   ├── requirements.txt       # Production / Docker deps
│   └── requirements-dev.txt   # Local dev deps (migrations, tests)
├── frontend/
│   └── src/app/
│       ├── (auth)/              # Login & Register pages
│       ├── (dashboard)/         # Main app pages
│       │   ├── dashboard/       # Today's tasks + AI briefing
│       │   ├── tasks/           # Category accordion + AI planner
│       │   ├── analytics/       # Stats + AI coach
│       │   └── tasks/[id]/      # Task edit + AI subtask generator
│       └── welcome/             # Landing page
└── docs/
    └── public/                  # Project documentation
```

---

## 📄 Documentation

| Document | Description |
|---|---|
| [User Guide](docs/public/user_guide.md) | How to use every feature effectively |
| [Agent Architecture](docs/public/agent_architecture.md) | Deep-dive into all 4 AI agents and their tools |
| [Agentic AI Guide](docs/public/agentic_guide.md) | All 6 agent endpoints with request/response examples |
| [System Flow Diagrams](docs/public/flow_diagrams.md) | Mermaid diagrams of all key system flows |
| [User Flow Diagram](docs/public/user_flow_diagram.md) | Screen-by-screen navigation flow |
| [Kaggle Writeup](docs/public/kaggle_writeup.md) | Concierge Agents competition writeup |
| [Improvements Roadmap](docs/public/improvements.md) | Future features and technical debt |
| [REST API Reference](docs/public/rest_api.md) | Full endpoint documentation including agent routes |
| [Database ERD](docs/public/erd.md) | Entity-Relationship diagram |
| [Wireframes](docs/public/wireframes.md) | Screen descriptions and UI element reference |

---

## 🤖 Agent Fleet Summary

### 1. Analytics Coach Agent — `POST /api/v1/agent/insights`
Queries your task database and uses Gemini to generate personalized coaching insights — completion rates, category performance, and reschedule patterns.

### 2. Task Planner Agent — `POST /api/v1/agent/plan`
Given a natural language goal (*"prepare for my Kaggle competition in 3 weeks"*), creates a category and populates 4–7 structured tasks with target dates automatically.

### 3. Rescheduler Agent — `POST /api/v1/agent/reschedule`
Scans all incomplete tasks that are overdue or previously rescheduled. Uses Gemini to assign balanced new target dates, then writes `TaskChangeLog` entries for a full audit trail.

### 4. Orchestrator Agent — `POST /api/v1/agent/chat`
The conversational master interface. Routes any message to the right sub-agent (analytics, planning, rescheduling) or responds directly for general chat. Powers the floating AI Chat Drawer.

### + Daily Briefing — `GET /api/v1/agent/briefing`
Generates a personalized morning greeting based on today's task count, overdue items, and upcoming titles. Appears on every dashboard load.

### + Subtask Generator — `POST /api/v1/agent/suggest-subtasks`
Breaks any task into 3–5 concrete actionable steps using Gemini, with one-click append to the task description.

---

## 🛡️ Privacy & Security

- All user data stored in **your own PostgreSQL instance** — zero third-party data sharing
- JWT-based authentication with configurable expiry
- Per-user data isolation enforced at every query level
- Gemini API calls use only task metadata (titles, dates, counts) — **never personal content**
- Every AI-initiated schedule change is logged in `task_change_log` with a human-readable reason
- In Docker, the browser never calls FastAPI directly — all requests go to Next.js at `/api/v1`, which proxies to the backend over the internal Docker network (`BACKEND_INTERNAL_URL`, e.g. `http://backend:8000`); FastAPI and PostgreSQL sit on that internal network, with Next.js as the public entry point
- Task titles and descriptions are currently stored as **plaintext** in PostgreSQL; JWT auth and network isolation limit normal access, but a `pg_dump`, volume snapshot, or backup would still expose readable content

**What about plaintext in the database?**

You may notice that task titles and descriptions sit in PostgreSQL as readable text. Network isolation and JWT auth cover normal access paths, but they do not help if someone obtains a database dump or backup. An improvement that could be implemented here is **per-user application-level encryption**:

Each user would have a random 256-bit data key (`K_data`), never stored in plaintext. Instead, it would be wrapped (encrypted) with a key derived from the user's password:

`K_user = Argon2id(password, per_user_salt)`

The database would hold only `encrypted_data_key`, `ciphertext`, `nonce`, and `salt` — not the raw keys or readable task text.

On **login**, the backend would derive `K_user` from the password, unwrap `K_data`, and keep it in memory for the session. On **read**, task fields would be decrypted in the API layer before the response is sent. On **write**, fields would be encrypted with **AES-256-GCM** (or XChaCha20-Poly1305) using `K_data` and a unique nonce per field. On **password change**, `K_data` would be re-wrapped with a new `K_user` — individual tasks would not need to be re-encrypted.

This would protect against **database compromise and backup leakage**: a dump alone would not be enough to read task content without the user's password. It would not provide zero-knowledge semantics — the running backend would still hold `K_data` in memory while serving requests.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
