# TaskExecutor — Entity Relationship Diagram

## Schema Overview

The TaskExecutor database is built on **four core tables** that model a personal task-management system with multi-auth user accounts, categorised tasks, and a change-tracking audit log.

| Table | Purpose |
|---|---|
| **users** | Stores user accounts supporting both local (password) and Google OAuth authentication. |
| **categories** | User-defined groupings for tasks, each with a colour and optional icon. A composite unique constraint on `(user_id, title)` prevents duplicate category names per user. |
| **tasks** | The central entity — individual to-do items owned by a user and assigned to a category, with scheduling fields (`target_date`, `start_time`, `end_time`) and completion tracking. |
| **task_change_log** | An append-only audit trail that records every time a task's target date is changed, capturing the reason and both the original and new dates. Rows cascade-delete when the parent task is removed. |

### Relationship Summary

| Relationship | Cardinality | FK Column | Notes |
|---|---|---|---|
| `users` → `categories` | One-to-Many | `categories.user_id` | Each user owns zero or more categories. |
| `users` → `tasks` | One-to-Many | `tasks.user_id` | Each user owns zero or more tasks. |
| `categories` → `tasks` | One-to-Many | `tasks.category_id` | Every task can belong to a category (nullable UUID). |
| `tasks` → `task_change_log` | One-to-Many | `task_change_log.task_id` | A task may have zero or more change-log entries. Deleting a task cascades to its log. |

---

## ER Diagram

```mermaid
erDiagram

    users {
        UUID id PK "Primary Key"
        VARCHAR(100) username "NOT NULL, UNIQUE"
        VARCHAR(255) email "NOT NULL, UNIQUE"
        VARCHAR(255) password_hash "NULLABLE"
        VARCHAR(50) auth_provider "NOT NULL, DEFAULT 'local' — local | google"
        VARCHAR(255) google_id "NULLABLE, UNIQUE"
        VARCHAR(500) avatar_url "NULLABLE"
        BOOLEAN is_active "DEFAULT TRUE"
        TIMESTAMPTZ created_at ""
        TIMESTAMPTZ updated_at ""
    }

    categories {
        UUID id PK "Primary Key"
        UUID user_id FK "FK → users.id, NOT NULL"
        VARCHAR(50) title "NOT NULL, UNIQUE(user_id, title)"
        VARCHAR(7) color_hex "NOT NULL, DEFAULT '#6C63FF'"
        VARCHAR(50) icon "NULLABLE"
        TIMESTAMPTZ created_at ""
    }

    tasks {
        UUID id PK "Primary Key"
        UUID user_id FK "FK → users.id, NOT NULL"
        UUID category_id FK "FK → categories.id, NULLABLE"
        VARCHAR(255) title "NOT NULL"
        TEXT description "NULLABLE"
        DATE target_date "NOT NULL"
        INTEGER estimated_duration_minutes "NULLABLE"
        TIME start_time "NULLABLE"
        TIME end_time "NULLABLE"
        BOOLEAN is_completed "NOT NULL, DEFAULT FALSE"
        INTEGER actual_duration_minutes "NULLABLE"
        TEXT completion_notes "NULLABLE"
        TIMESTAMPTZ completed_at "NULLABLE"
        TIMESTAMPTZ created_at ""
        TIMESTAMPTZ updated_at ""
    }

    task_change_log {
        UUID id PK "Primary Key"
        UUID task_id FK "FK → tasks.id, NOT NULL, ON DELETE CASCADE"
        TEXT reason "NOT NULL"
        DATE original_target_date "NOT NULL"
        DATE new_target_date "NOT NULL"
        TIMESTAMPTZ changed_at ""
    }

    users ||--o{ categories : "owns"
    users ||--o{ tasks : "owns"
    categories ||--o{ tasks : "groups"
    tasks ||--o{ task_change_log : "tracks changes"
```

---

> [!NOTE]
> **Rendering** — This diagram uses [Mermaid `erDiagram`](https://mermaid.js.org/syntax/entityRelationshipDiagram.html) syntax. It renders natively on GitHub, GitLab, and in VS Code with the *Markdown Preview Mermaid Support* extension.
