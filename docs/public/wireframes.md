# TaskExecutor — Wireframes

This document contains wireframe descriptions for all screens in TaskExecutor. Each screen maps to the corresponding flow in [flow_diagrams.md](./flow_diagrams.md).

---

## Screen 0 — Home / Landing Page

> **Flow Reference:** Entry point → navigates to Screen 1 (Login/Signup)

### Key UI Elements
| Element | Description |
|---|---|
| App Logo + Name | "TaskExecutor" branding |
| Tagline | "Track. Execute. Achieve." |
| Feature Cards | Calendar scheduling, Completion tracking, Smart analytics |
| CTA Buttons | "Login" and "Sign Up" — navigate to Screen 1 |

### User Actions
- Click **Login** → Screen 1 (Login tab)
- Click **Sign Up** → Screen 1 (Register tab)

---

## Screen 1 — Login / Sign Up

> **Flow Reference:** Authentication flow → success navigates to Screen 2 (Dashboard)

### Key UI Elements
| Element | Description |
|---|---|
| Sign In heading | With directional arrow |
| Email input | Text field |
| Password input | Masked field |
| Login button | Primary action (purple accent) |
| Google button | "Continue with Google" — OAuth flow |
| Sign Up link | Toggle to registration form |
| Forgot Password | Text link (deferred for MVP) |

### User Actions
- Enter credentials → click **Login** → Screen 2
- Click **Continue with Google** → Google OAuth → Screen 2
- Click **Sign Up** → switch to registration fields
- New user registration auto-seeds 3 categories (Work, Personal, Other)

---

## Screen 2 — Dashboard (Today's View)

> **Flow Reference:** Post-login default screen → hub for all navigation

### Key UI Elements
| Element | Description |
|---|---|
| Current Date | "Saturday, July 6" prominently displayed |
| Week Calendar | Horizontal row of current week dates, today highlighted |
| AI Daily Briefing Card | AI-generated morning greeting from Gemini — appears at top of dashboard |
| Category Chips | All / Work / Personal / Other — with color dots |
| Task Cards | Title, time range, category color border |
| Completion State | Completed tasks greyed out, uncompleted highlighted |
| FAB Button | Floating "+" button → navigates to Create Task |
| AI Chat Button | Floating ✨ button → opens AI Chat Drawer |
| Empty State | "No tasks scheduled" message when no tasks exist |

### User Actions
- Click **date in calendar** → Date View (date-specific tasks)
- Click **category chip** → filter tasks
- Click **"+" FAB** → Create Task
- Click **task card** → Task Edit page
- Click **checkbox** → mark completed (modal for optional completion notes)
- Click **✨ button** → open AI Chat Drawer

---

## Screen 3 — Create / Edit Task

> **Flow Reference:** Accessible from FAB on Dashboard → returns to Dashboard on submit

### Key UI Elements
| Element | Description |
|---|---|
| Back Arrow | Returns to previous screen |
| Task Name | Required text input |
| Description | Optional textarea (supports markdown checklist items) |
| Date Picker | Calendar popup — selects `target_date` |
| Time Picker | Start time and end time (optional) |
| Estimated Duration | Minutes input (optional) |
| Category Selector | Dropdown with user's categories |
| Save / CREATE TASK button | Submit — creates task and navigates back |
| AI Subtask Generator | Card below form — generates 3–5 actionable steps from task title+description |
| Rescheduling Audit History | Shows all previous date changes with reasons |

### User Actions
- Fill required fields → click **CREATE TASK** → task created → Dashboard
- Click **back arrow** → discard and return
- In **edit mode**: changing `target_date` triggers Date Change Modal
- Click **Generate Actionable Subtasks** → AI returns subtask list
- Click **+ Add to Desc** on any subtask → appends to description

---

## Screen 4 — Task List (Categories View)

> **Flow Reference:** Accessible from sidebar navigation → grouped by category as accordion

### Key UI Elements
| Element | Description |
|---|---|
| Category Sections | Accordion sections, one per category (expandable) |
| Task Cards | Title, date, time range in list format |
| Checkbox | Click to mark completed |
| Completed Badge | "COMPLETED !" label, card visually greyed out |
| AI Goal & Task Planner | Card at bottom — type a goal, get a structured task plan |

### Visual States
| State | Appearance |
|---|---|
| Uncompleted | Full color, highlighted, active checkbox |
| Completed | Greyed out, checkmark filled, "COMPLETED" label |
| Work category | Red/orange accent |
| Personal category | Purple accent |
| Other category | Green accent |

### User Actions
- Click **checkbox** → mark as completed (optional: completion notes modal)
- Click **task card** → navigate to Task Edit (Screen 3 in edit mode)
- Expand/collapse **category accordion** sections
- Use **AI Goal & Task Planner** → type goal → agent creates category + tasks

---

## Screen 5 — Analytics & Export

> **Flow Reference:** Accessible from sidebar navigation → shows productivity stats + AI coach

### Key UI Elements
| Element | Description |
|---|---|
| Stats Cards | Total tasks, completed, pending, overdue, completion % |
| Category Performance | Bar-style breakdown of completion rate per category |
| AI Coach Card | Text input + "Get AI Insights" button |
| Export Button | "Export JSON" — downloads all task data as portable JSON |

### User Actions
- Type question in **AI Coach** input → click **Get AI Insights** → coaching response appears
- Click **Export JSON** → download data file

---

## Screen 6 — Date View

> **Flow Reference:** Accessible by clicking a date in the Dashboard week calendar

### Key UI Elements
| Element | Description |
|---|---|
| Selected Date Header | Shows chosen date prominently |
| Task List | All tasks for that specific date |
| FAB Button | Create new task pre-filled with that date |

### User Actions
- Click **task card** → Task Edit page
- Click **"+" FAB** → Create Task with date pre-filled
- Navigate back → Dashboard

---

## AI Chat Drawer (available on all screens)

> **Trigger:** ✨ floating button in the bottom-right corner of every page

### Key UI Elements
| Element | Description |
|---|---|
| Drawer Panel | Slides in from the right |
| Chat History | Scrollable conversation history |
| Input Field | Text input for natural language message |
| Send Button | Submits message to Orchestrator agent |
| Loading Indicator | Shows while agent is thinking (10–30s) |

### What the Orchestrator Routes
| Message Intent | Routes To |
|---|---|
| Analytics / coaching / productivity | Analytics Coach Agent |
| Planning / goal / organize | Task Planner Agent |
| Overdue / reschedule / overwhelmed | Rescheduler Agent |
| General chat / greetings | Orchestrator responds directly |

---

## Modal — Date Change Reason

> **Flow Reference:** Triggered when editing a task and changing `target_date`

### Key UI Elements
| Element | Description |
|---|---|
| Modal Overlay | Semi-transparent dark background |
| Heading | "Date Change Required" |
| Prompt Text | "Why are you rescheduling this task?" |
| Reason Input | Multi-line text area (required) |
| Date Display | Old date (crossed out) → New date |
| Cancel Button | Outlined — closes modal, reverts date change |
| Save Change Button | Filled purple — saves reason + new date |

### Business Logic
- Reason field is **required** — Save is disabled until filled
- Creates entry in `task_change_log` table with:
  - `original_target_date` (old date)
  - `new_target_date` (new date)
  - `reason` (from text input)
- This data feeds the Rescheduler Agent and Analytics Coach

---

## Screen Flow Summary

```
Screen 0 (Welcome) → Screen 1 (Login/Signup)
                           ↓
                 Screen 2 (Dashboard)
               ↙        ↓         ↘       ↘
   Screen 3       Screen 4       Screen 5   Screen 6
 (Create/Edit)  (Task List)   (Analytics) (Date View)
       ↓              ↓
    [Submit]    [Edit Task → Date Change Modal?]
       ↓              ↓
   Dashboard     Dashboard

AI Chat Drawer floats on all screens ↑
```

---

## Design System Reference

All screens follow this design system:
- **Dark navy/black backgrounds** for reduced eye strain
- **Purple/violet accent** (`#6C63FF`) for primary actions and interactive elements
- **Category-coded colors** for visual task grouping (user-configurable hex)
- **Card-based layouts** for task display
- **Floating action buttons** for quick task creation
- **Greyed-out completed states** for clear visual differentiation
- **Framer Motion animations** for smooth page transitions and drawer open/close
