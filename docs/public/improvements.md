# Improvements & Roadmap — TaskExecutor

> Honest assessment of current limitations and a prioritized roadmap for future development

---

## Current Limitations

### Performance
| Issue | Cause | Impact |
|---|---|---|
| Agent responses take 10–30s | Gemini + ADK tool loop latency | User wait time during planning/rescheduling |
| No streaming responses | ADK `run_async` collects full response | No incremental text display |
| Briefing blocks initial render | API called on mount | Slight layout shift on dashboard load |

### Functionality
| Issue | Description |
|---|---|
| No multi-turn chat memory | Each chat message starts a fresh session — agent forgets previous turns |
| No push notifications | Users must manually check for overdue tasks |
| No recurring tasks | Each task is a one-time event — no weekly/monthly repeats |
| No attachments | Tasks can't have files, images, or links |
| No collaboration | Strictly single-user — no sharing or team views |

### Technical Debt
| Issue | Description |
|---|---|
| No automated tests | No unit or integration tests for agents or endpoints |
| No rate limiting | Agent endpoints can be called repeatedly without throttling |
| Briefing cache is in-memory only | `_briefing_cache` dict resets on server restart; analytics has no caching |
| No structured error codes | Frontend receives plain text error messages |

---

## Prioritized Improvements

### 🔥 High Priority (Next Sprint)

#### 1. Streaming Agent Responses
Instead of waiting for the full agent response, stream tokens to the frontend as they arrive. This makes the UX feel instant.

**Implementation:**
```python
# Backend: Server-Sent Events endpoint
@router.post("/chat/stream")
async def chat_stream(request_data, current_user):
    async def event_generator():
        async for event in runner.run_async(...):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        yield f"data: {json.dumps({'chunk': part.text})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

```typescript
// Frontend: EventSource consumer
const source = new EventSource('/api/v1/agent/chat/stream')
source.onmessage = (e) => {
  const { chunk } = JSON.parse(e.data)
  setResponse(prev => prev + chunk)
}
```

#### 2. Multi-Turn Chat Memory
Persist conversation history in the user's session so the agent remembers previous messages in the same chat session.

**Implementation:**
- Store `chatHistory` array in browser `sessionStorage`
- Send full history to backend on each message
- Pass history as `Content` objects in `runner.run_async()`

#### 3. Persistent Briefing Cache
Current in-memory cache (`_briefing_cache`) is reset on every server restart. Replace with Redis or a DB-backed TTL cache:

```python
_briefing_cache: dict[str, tuple[str, float]] = {}

async def get_cached_briefing(user_id: str, generate_fn) -> str:
    cached = _briefing_cache.get(user_id)
    if cached and (time.time() - cached[1]) < 3600:
        return cached[0]
    result = await generate_fn()
    _briefing_cache[user_id] = (result, time.time())
    return result
```

---

### ⚡ Medium Priority (Next Month)

#### 4. Recurring Tasks
Add `recurrence_rule` field to tasks following iCal RRULE syntax:
- `FREQ=WEEKLY;BYDAY=MO,WE,FR`
- `FREQ=MONTHLY;BYMONTHDAY=1`

Implement a background job (APScheduler or Celery) to auto-create recurring instances.

#### 5. Smart Proactive Notifications
Add a scheduled background job that:
1. Runs nightly (e.g. 8 PM)
2. Checks for tomorrow's tasks and overdue items
3. Sends a personalized AI-generated digest to the user's email
4. Optionally triggers the Rescheduler if overdue count exceeds a threshold

**Stack addition:** FastAPI BackgroundTasks + SMTP or SendGrid

#### 6. Google Calendar Sync
Two-way sync with Google Calendar:
- Tasks with `start_time`/`end_time` → create Calendar events
- Calendar events → optionally import as tasks
- Use OAuth2 Calendar API scopes

#### 7. Rate Limiting & Abuse Prevention
Add per-user rate limiting on agent endpoints:
```python
from slowapi import Limiter
limiter = Limiter(key_func=lambda req: req.state.user_id)

@router.post("/chat")
@limiter.limit("10/minute")
async def chat_with_assistant(...):
```

---

### 🌱 Future Vision (3–6 Months)

#### 8. Mobile App (React Native / Expo)
Same API, native mobile experience:
- Push notifications via Expo Notifications
- Offline task creation with sync on reconnect
- Voice input for quick task capture

#### 9. Multi-User Households
Shared task lists with role-based access:
- `OWNER` — full control
- `COLLABORATOR` — can create and complete
- `VIEWER` — read-only

Add `shared_with` relationship table and scoped JWT claims.

#### 10. Voice Input
Integrate Web Speech API in the chat drawer:
```typescript
const recognition = new webkitSpeechRecognition()
recognition.onresult = (e) => {
  setChatInput(e.results[0][0].transcript)
}
recognition.start()
```

#### 11. Automated Testing Suite
```
tests/
├── unit/
│   ├── test_analytics_agent.py   # Mock DB, test tool outputs
│   ├── test_planner_agent.py     # Mock Gemini, test task creation
│   └── test_rescheduler.py       # Test date redistribution logic
├── integration/
│   ├── test_auth_flow.py         # Full register → login → token
│   └── test_task_crud.py         # Full task lifecycle
└── e2e/
    └── test_agent_endpoints.py   # Live Gemini calls (requires API key)
```

#### 12. Agent Observability Dashboard
Build an internal `/admin/agents` page showing:
- Per-agent call counts and success rates
- Average latency per agent
- Most common user intents (categorized without content)
- Gemini token usage per day

---

## Architecture Improvements

### Move to ADK Async Client
When Google releases a fully async ADK/Gemini client, replace the `run_in_executor` workaround:
```python
# Current (sync offloaded to thread pool)
result = await loop.run_in_executor(None, partial(_sync_gemini_generate, prompt))

# Future (native async)
response = await client.models.generate_content_async(model=..., contents=prompt)
```

### Add Redis for Session Caching
Replace `InMemorySessionService` (per-request, ephemeral) with Redis-backed session storage for multi-turn persistence:
```python
from google.adk.sessions import RedisSessionService
session_service = RedisSessionService(redis_url="redis://localhost:6379")
```

### Database Migrations (Alembic)
Currently tables are auto-created at startup. Replace with proper Alembic migration scripts for production deployments:
```bash
alembic revision --autogenerate -m "add recurrence_rule to tasks"
alembic upgrade head
```

### Horizontal Scaling
For production:
- Decouple agents into separate microservices
- Use a message queue (Redis Streams or RabbitMQ) to handle agent job queuing
- Deploy frontend on Vercel, backend on Cloud Run (each container stateless)

---

## Security Hardening

| Improvement | Description |
|---|---|
| HTTPS enforcement | Add TLS in production via nginx reverse proxy |
| Refresh tokens | Add refresh token rotation alongside access tokens |
| Secret rotation | Move API keys to AWS Secrets Manager or GCP Secret Manager |
| Input sanitization | Add XSS protection on task title/description fields |
| Audit log UI | Admin-visible log of all AI agent actions taken |

---

## Summary

The application is feature-complete and functional for a solo productivity tool demo. The key engineering priorities for production readiness are:

1. **Streaming responses** (biggest UX win)
2. **Multi-turn memory** (biggest intelligence win)
3. **Automated tests** (biggest reliability win)
4. **Rate limiting** (biggest safety win)
5. **Recurring tasks** (biggest missing use-case)
