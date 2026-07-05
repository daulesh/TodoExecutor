# TaskExecutor REST API Documentation

> **Version:** 1.1  
> **Base URL:** `/api/v1`  
> **Last Updated:** 2026-07-06

---

## Table of Contents

- [Overview](#overview)
- [Authentication Scheme](#authentication-scheme)
- [Common Data Types & Formats](#common-data-types--formats)
- [Error Response Format](#error-response-format)
- [Pagination](#pagination)
- [Rate Limiting](#rate-limiting)
- [Endpoints — Authentication](#endpoints--authentication)
  - [POST /auth/register](#post-authregister)
  - [POST /auth/login](#post-authlogin)
  - [POST /auth/google](#post-authgoogle)
  - [POST /auth/refresh](#post-authrefresh)
  - [GET /auth/me](#get-authme)
- [Endpoints — Tasks](#endpoints--tasks)
  - [GET /tasks](#get-tasks)
  - [GET /tasks/{task_id}](#get-taskstask_id)
  - [POST /tasks](#post-tasks)
  - [PUT /tasks/{task_id}](#put-taskstask_id)
  - [PATCH /tasks/{task_id}/complete](#patch-taskstask_idcomplete)
  - [DELETE /tasks/{task_id}](#delete-taskstask_id)
- [Endpoints — Task Change Log](#endpoints--task-change-log)
  - [GET /tasks/{task_id}/changes](#get-taskstask_idchanges)
- [Endpoints — Categories](#endpoints--categories)
  - [GET /categories](#get-categories)
- [Endpoints — Agent AI]
  - [GET /agent/briefing](#get-agentbriefing)
  - [POST /agent/suggest-subtasks](#post-agentsuggest-subtasks)
  - [POST /agent/insights](#post-agentinsights)
  - [POST /agent/plan](#post-agentplan)
  - [POST /agent/reschedule](#post-agentreschedule)
  - [POST /agent/chat](#post-agentchat)
- [Endpoints — Analytics & Export](#endpoints--analytics--export)
  - [GET /analytics/summary](#get-analyticssummary)
  - [GET /export/json](#get-exportjson)

---



## Overview

The TaskExecutor API is a RESTful service for managing personal tasks with scheduling, categorization, analytics, and change-tracking capabilities. All data exchange uses JSON (`application/json`).


| Property       | Value                             |
| -------------- | --------------------------------- |
| Protocol       | HTTPS                             |
| Base URL       | `/api/v1`                         |
| Content-Type   | `application/json`                |
| Character Set  | UTF-8                             |
| Authentication | Bearer JWT (Authorization header) |


---



## Authentication Scheme

All endpoints except **registration**, **login**, **Google OAuth**, and **token refresh** require a valid JWT bearer token.

Include the token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```


| Token Type    | Lifetime | Usage                                     |
| ------------- | -------- | ----------------------------------------- |
| Access Token  | 30 min   | Passed in `Authorization` header          |
| Refresh Token | 7 days   | Sent to `POST /auth/refresh` for rotation |


When an access token expires the API returns `401 Unauthorized`. Use the refresh token to obtain a new access/refresh token pair.

---



## Common Data Types & Formats


| Type     | Format                  | Example                                  |
| -------- | ----------------------- | ---------------------------------------- |
| UUID     | RFC 4122 v4             | `"d290f1ee-6c54-4b01-90e6-d701748f0851"` |
| Date     | ISO 8601 (`YYYY-MM-DD`) | `"2026-06-21"`                           |
| DateTime | ISO 8601 with timezone  | `"2026-06-21T14:30:00Z"`                 |
| Time     | 24-hour (`HH:MM`)       | `"14:30"`                                |
| Boolean  | JSON boolean            | `true` / `false`                         |
| String   | UTF-8 encoded           | `"Buy groceries"`                        |


---



## Error Response Format

All error responses follow a consistent structure:

```json
{
  "detail": "Human-readable error message.",
  "error_code": "MACHINE_READABLE_CODE"
}
```



### Standard Error Codes


| HTTP Status | `error_code`             | Meaning                                           |
| ----------- | ------------------------ | ------------------------------------------------- |
| 400         | `VALIDATION_ERROR`       | Request body or parameters failed validation      |
| 400         | `CHANGE_REASON_REQUIRED` | `target_date` was changed without `change_reason` |
| 401         | `INVALID_CREDENTIALS`    | Email/password combination is incorrect           |
| 401         | `TOKEN_EXPIRED`          | Access or refresh token has expired               |
| 401         | `INVALID_TOKEN`          | Token is malformed or signature is invalid        |
| 403         | `FORBIDDEN`              | Authenticated user lacks permission               |
| 404         | `NOT_FOUND`              | Requested resource does not exist                 |
| 409         | `ALREADY_EXISTS`         | Resource with unique constraint already exists    |
| 422         | `UNPROCESSABLE_ENTITY`   | Semantically invalid input                        |
| 429         | `RATE_LIMITED`           | Too many requests (planned)                       |
| 500         | `INTERNAL_ERROR`         | Unexpected server error                           |


---



## Pagination

Endpoints that return collections (e.g., `GET /tasks`) return the **full result set** matching the provided filters. Cursor-based or offset pagination is **not yet implemented** but is planned for a future release.

> [!NOTE]
> When pagination is introduced, list endpoints will accept `limit` and `offset` (or `cursor`) query parameters and return a wrapper object with `items`, `total`, `limit`, and `offset` fields.

---



## Rate Limiting

> [!IMPORTANT]
> Rate limiting is **planned but not yet enforced**. When enabled, rate-limited responses will return HTTP `429` with a `Retry-After` header indicating seconds until the next allowed request.

Expected future limits:


| Scope             | Limit             |
| ----------------- | ----------------- |
| Authentication    | 10 requests / min |
| General API calls | 60 requests / min |


---



## Endpoints — Authentication

---



### POST /auth/register

Register a new user account.


| Property          | Value                   |
| ----------------- | ----------------------- |
| **URL**           | `/api/v1/auth/register` |
| **Method**        | `POST`                  |
| **Auth Required** | No                      |




#### Request Headers


| Header       | Value            | Required |
| ------------ | ---------------- | -------- |
| Content-Type | application/json | Yes      |




#### Request Body


| Field      | Type   | Required | Constraints                | Description          |
| ---------- | ------ | -------- | -------------------------- | -------------------- |
| `email`    | string | Yes      | Valid email, max 255 chars | User's email address |
| `password` | string | Yes      | Min 8 characters           | Account password     |
| `name`     | string | Yes      | Min 1, max 100 chars       | User's display name  |


```json
{
  "email": "alice@example.com",
  "password": "s3cureP@ss!",
  "name": "Alice Johnson"
}
```



#### Success Response

**Status:** `201 Created`

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "email": "alice@example.com",
  "name": "Alice Johnson",
  "created_at": "2026-06-21T14:30:00Z"
}
```



#### Error Responses

**409 Conflict** — Email already registered

```json
{
  "detail": "A user with this email already exists.",
  "error_code": "ALREADY_EXISTS"
}
```

**400 Bad Request** — Validation failure

```json
{
  "detail": "Password must be at least 8 characters.",
  "error_code": "VALIDATION_ERROR"
}
```



#### Notes

- Passwords are hashed server-side using bcrypt before storage.
- The response does **not** include tokens — the client must call `POST /auth/login` after registration.

---



### POST /auth/login

Authenticate with email and password. Returns a JWT access/refresh token pair.


| Property          | Value                |
| ----------------- | -------------------- |
| **URL**           | `/api/v1/auth/login` |
| **Method**        | `POST`               |
| **Auth Required** | No                   |




#### Request Headers


| Header       | Value            | Required |
| ------------ | ---------------- | -------- |
| Content-Type | application/json | Yes      |




#### Request Body


| Field      | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `email`    | string | Yes      | Registered email |
| `password` | string | Yes      | Account password |


```json
{
  "email": "alice@example.com",
  "password": "s3cureP@ss!"
}
```



#### Success Response

**Status:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "email": "alice@example.com",
    "name": "Alice Johnson"
  }
}
```



#### Error Responses

**401 Unauthorized** — Invalid credentials

```json
{
  "detail": "Invalid email or password.",
  "error_code": "INVALID_CREDENTIALS"
}
```



#### Notes

- `expires_in` is the access token lifetime in **seconds**.
- Store `refresh_token` securely; it is required to obtain new access tokens.

---



### POST /auth/google

Authenticate or register via Google OAuth 2.0. If the Google account email does not match an existing user, a new account is created automatically.


| Property          | Value                 |
| ----------------- | --------------------- |
| **URL**           | `/api/v1/auth/google` |
| **Method**        | `POST`                |
| **Auth Required** | No                    |




#### Request Headers


| Header       | Value            | Required |
| ------------ | ---------------- | -------- |
| Content-Type | application/json | Yes      |




#### Request Body


| Field      | Type   | Required | Description                                   |
| ---------- | ------ | -------- | --------------------------------------------- |
| `id_token` | string | Yes      | Google-issued ID token from client-side OAuth |


```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```



#### Success Response

**Status:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "is_new_user": true,
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "alice@gmail.com",
    "name": "Alice Johnson"
  }
}
```



#### Error Responses

**401 Unauthorized** — Invalid or expired Google token

```json
{
  "detail": "Google ID token is invalid or expired.",
  "error_code": "INVALID_TOKEN"
}
```



#### Notes

- The server validates the `id_token` with Google's public keys.
- `is_new_user` indicates whether a new account was created (`true`) or an existing account was matched (`false`).
- The user's `name` is populated from the Google profile on first sign-in.

---



### POST /auth/refresh

Exchange a valid refresh token for a new access/refresh token pair.


| Property          | Value                  |
| ----------------- | ---------------------- |
| **URL**           | `/api/v1/auth/refresh` |
| **Method**        | `POST`                 |
| **Auth Required** | No                     |




#### Request Headers


| Header       | Value            | Required |
| ------------ | ---------------- | -------- |
| Content-Type | application/json | Yes      |




#### Request Body


| Field           | Type   | Required | Description                     |
| --------------- | ------ | -------- | ------------------------------- |
| `refresh_token` | string | Yes      | Previously issued refresh token |


```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```



#### Success Response

**Status:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```



#### Error Responses

**401 Unauthorized** — Refresh token expired or invalid

```json
{
  "detail": "Refresh token has expired. Please log in again.",
  "error_code": "TOKEN_EXPIRED"
}
```



#### Notes

- **Token rotation:** Each call issues a new refresh token and **invalidates** the previous one.
- If a previously-invalidated refresh token is used, **all tokens for the user are revoked** as a security measure (replay detection).

---



### GET /auth/me

Retrieve the profile of the currently authenticated user.


| Property          | Value             |
| ----------------- | ----------------- |
| **URL**           | `/api/v1/auth/me` |
| **Method**        | `GET`             |
| **Auth Required** | **Yes**           |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |




#### Success Response

**Status:** `200 OK`

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "email": "alice@example.com",
  "name": "Alice Johnson",
  "created_at": "2026-06-21T14:30:00Z",
  "auth_provider": "local"
}
```


| Field           | Type   | Description                         |
| --------------- | ------ | ----------------------------------- |
| `id`            | UUID   | Unique user identifier              |
| `email`         | string | User's email address                |
| `name`          | string | Display name                        |
| `created_at`    | string | ISO 8601 account creation timestamp |
| `auth_provider` | string | `"local"` or `"google"`             |




#### Error Responses

**401 Unauthorized** — Missing or invalid token

```json
{
  "detail": "Could not validate credentials.",
  "error_code": "INVALID_TOKEN"
}
```

---



## Endpoints — Tasks

All task endpoints require authentication.

### Task Object Schema


| Field          | Type     | Nullable | Description                                    |
| -------------- | -------- | -------- | ---------------------------------------------- |
| `id`           | UUID     | No       | Unique task identifier                         |
| `title`        | string   | No       | Task title (max 255 chars)                     |
| `description`  | string   | Yes      | Detailed description                           |
| `target_date`  | date     | No       | Scheduled date (`YYYY-MM-DD`)                  |
| `target_time`  | string   | Yes      | Scheduled time (`HH:MM`, 24-hour)              |
| `is_completed` | boolean  | No       | Completion status                              |
| `completed_at` | datetime | Yes      | Timestamp when task was marked complete        |
| `category_id`  | UUID     | Yes      | Associated category (FK)                       |
| `category`     | object   | Yes      | Nested category object (`id`, `name`, `color`) |
| `created_at`   | datetime | No       | Creation timestamp                             |
| `updated_at`   | datetime | No       | Last update timestamp                          |


---



### GET /tasks

Retrieve all tasks for the authenticated user. Supports filtering by date range, completion status, and category.


| Property          | Value           |
| ----------------- | --------------- |
| **URL**           | `/api/v1/tasks` |
| **Method**        | `GET`           |
| **Auth Required** | **Yes**         |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |




#### Query Parameters


| Parameter      | Type    | Required | Default | Description                                                                        |
| -------------- | ------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `date`         | date    | No       | —       | Exact date filter (`YYYY-MM-DD`). Mutually exclusive with `start_date`/`end_date`. |
| `start_date`   | date    | No       | —       | Start of date range (inclusive)                                                    |
| `end_date`     | date    | No       | —       | End of date range (inclusive)                                                      |
| `is_completed` | boolean | No       | —       | Filter by completion status (`true` / `false`)                                     |
| `category_id`  | UUID    | No       | —       | Filter by category                                                                 |




#### Example Request

```
GET /api/v1/tasks?start_date=2026-06-01&end_date=2026-06-30&is_completed=false
Authorization: Bearer eyJhbGci...
```



#### Success Response

**Status:** `200 OK`

```json
[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread, and butter",
    "target_date": "2026-06-22",
    "target_time": "10:00",
    "is_completed": false,
    "completed_at": null,
    "category_id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
    "category": {
      "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
      "name": "Personal",
      "color": "#4CAF50"
    },
    "created_at": "2026-06-20T09:00:00Z",
    "updated_at": "2026-06-20T09:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Prepare presentation",
    "description": null,
    "target_date": "2026-06-25",
    "target_time": "14:30",
    "is_completed": false,
    "completed_at": null,
    "category_id": null,
    "category": null,
    "created_at": "2026-06-18T11:20:00Z",
    "updated_at": "2026-06-19T08:15:00Z"
  }
]
```



#### Error Responses

**400 Bad Request** — Invalid filter combination

```json
{
  "detail": "Cannot use 'date' together with 'start_date' or 'end_date'.",
  "error_code": "VALIDATION_ERROR"
}
```



#### Notes

- When no filters are supplied, **all tasks** for the authenticated user are returned.
- `date` is a convenience shorthand — it is equivalent to setting both `start_date` and `end_date` to the same value.
- Results are ordered by `target_date` ascending, then `target_time` ascending (nulls last).

---



### GET /tasks/{task_id}

Retrieve a single task by its ID.


| Property          | Value                     |
| ----------------- | ------------------------- |
| **URL**           | `/api/v1/tasks/{task_id}` |
| **Method**        | `GET`                     |
| **Auth Required** | **Yes**                   |




#### Path Parameters


| Parameter | Type | Required | Description          |
| --------- | ---- | -------- | -------------------- |
| `task_id` | UUID | Yes      | The task's unique ID |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |




#### Success Response

**Status:** `200 OK`

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, and butter",
  "target_date": "2026-06-22",
  "target_time": "10:00",
  "is_completed": false,
  "completed_at": null,
  "category_id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
  "category": {
    "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
    "name": "Personal",
    "color": "#4CAF50"
  },
  "created_at": "2026-06-20T09:00:00Z",
  "updated_at": "2026-06-20T09:00:00Z"
}
```



#### Error Responses

**404 Not Found**

```json
{
  "detail": "Task not found.",
  "error_code": "NOT_FOUND"
}
```



#### Notes

- Users can only access their own tasks. Attempting to access another user's task returns `404` (not `403`) to prevent ID enumeration.

---



### POST /tasks

Create a new task.


| Property          | Value           |
| ----------------- | --------------- |
| **URL**           | `/api/v1/tasks` |
| **Method**        | `POST`          |
| **Auth Required** | **Yes**         |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |
| Content-Type  | application/json        | Yes      |




#### Request Body


| Field         | Type   | Required | Constraints       | Description           |
| ------------- | ------ | -------- | ----------------- | --------------------- |
| `title`       | string | Yes      | 1–255 chars       | Task title            |
| `description` | string | No       | Max 2000 chars    | Detailed description  |
| `target_date` | date   | Yes      | `YYYY-MM-DD`      | Scheduled date        |
| `target_time` | string | No       | `HH:MM` (24-hour) | Scheduled time        |
| `category_id` | UUID   | No       | Must exist        | Category to associate |


```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, and butter",
  "target_date": "2026-06-22",
  "target_time": "10:00",
  "category_id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a"
}
```



#### Success Response

**Status:** `201 Created`

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, and butter",
  "target_date": "2026-06-22",
  "target_time": "10:00",
  "is_completed": false,
  "completed_at": null,
  "category_id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
  "category": {
    "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
    "name": "Personal",
    "color": "#4CAF50"
  },
  "created_at": "2026-06-21T14:30:00Z",
  "updated_at": "2026-06-21T14:30:00Z"
}
```



#### Error Responses

**400 Bad Request** — Missing required field

```json
{
  "detail": "Field 'title' is required.",
  "error_code": "VALIDATION_ERROR"
}
```

**404 Not Found** — Invalid category

```json
{
  "detail": "Category not found.",
  "error_code": "NOT_FOUND"
}
```



#### Notes

- `is_completed` defaults to `false` and cannot be set at creation time.
- `target_time` is optional — tasks without a time are treated as all-day tasks.

---



### PUT /tasks/{task_id}

Update an existing task. This is a **full replacement** — all writable fields must be provided.


| Property          | Value                     |
| ----------------- | ------------------------- |
| **URL**           | `/api/v1/tasks/{task_id}` |
| **Method**        | `PUT`                     |
| **Auth Required** | **Yes**                   |




#### Path Parameters


| Parameter | Type | Required | Description          |
| --------- | ---- | -------- | -------------------- |
| `task_id` | UUID | Yes      | The task's unique ID |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |
| Content-Type  | application/json        | Yes      |




#### Request Body


| Field           | Type         | Required    | Constraints       | Description                                  |
| --------------- | ------------ | ----------- | ----------------- | -------------------------------------------- |
| `title`         | s            | Yes         | 1–255 chars       | Task title                                   |
| `description`   | tringstring | No          | Max 2000 chars    | Detailed description (send `null` to clear)  |
| `target_date`   | date         | Yes         | `YYYY-MM-DD`      | Scheduled date                               |
| `target_time`   | string       | No          | `HH:MM` (24-hour) | Scheduled time (send `null` to clear)        |
| `category_id`   | UUID         | No          | Must exist        | Category to associate (send `null` to clear) |
| `change_reason` | string       | Conditional | 1–500 chars       | **Required** when `target_date` is changed   |


> [!WARNING]
> **Target Date Change Logic:** When the `target_date` value in the request body differs from the task's current `target_date`, the `change_reason` field becomes **mandatory**. Omitting it will result in a `400` error. This ensures all date rescheduling is auditable through the [Task Change Log](#get-taskstask_idchanges).



#### Example — Standard Update (no date change)

```json
{
  "title": "Buy groceries and snacks",
  "description": "Milk, eggs, bread, butter, and chips",
  "target_date": "2026-06-22",
  "target_time": "11:00",
  "category_id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a"
}
```



#### Example — Update With Date Change

```json
{
  "title": "Buy groceries and snacks",
  "description": "Milk, eggs, bread, butter, and chips",
  "target_date": "2026-06-25",
  "target_time": "11:00",
  "category_id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
  "change_reason": "Store is closed on the 22nd due to holiday"
}
```



#### Success Response

**Status:** `200 OK`

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Buy groceries and snacks",
  "description": "Milk, eggs, bread, butter, and chips",
  "target_date": "2026-06-25",
  "target_time": "11:00",
  "is_completed": false,
  "completed_at": null,
  "category_id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
  "category": {
    "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
    "name": "Personal",
    "color": "#4CAF50"
  },
  "created_at": "2026-06-20T09:00:00Z",
  "updated_at": "2026-06-21T15:45:00Z"
}
```



#### Error Responses

**400 Bad Request** — Date changed without reason

```json
{
  "detail": "A change_reason is required when modifying target_date.",
  "error_code": "CHANGE_REASON_REQUIRED"
}
```

**404 Not Found**

```json
{
  "detail": "Task not found.",
  "error_code": "NOT_FOUND"
}
```



#### Notes

- When `target_date` is changed **and** a valid `change_reason` is provided, the server automatically creates a record in the **Task Change Log** with the old date, new date, reason, and timestamp.
- `change_reason` is ignored (not stored) if `target_date` has not actually changed.
- To update only the completion status, use `PATCH /tasks/{task_id}/complete` instead.

---



### PATCH /tasks/{task_id}/complete

Toggle or set the completion status of a task.


| Property          | Value                              |
| ----------------- | ---------------------------------- |
| **URL**           | `/api/v1/tasks/{task_id}/complete` |
| **Method**        | `PATCH`                            |
| **Auth Required** | **Yes**                            |




#### Path Parameters


| Parameter | Type | Required | Description          |
| --------- | ---- | -------- | -------------------- |
| `task_id` | UUID | Yes      | The task's unique ID |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |
| Content-Type  | application/json        | Yes      |




#### Request Body


| Field          | Type    | Required | Description                                |
| -------------- | ------- | -------- | ------------------------------------------ |
| `is_completed` | boolean | Yes      | `true` to mark complete, `false` to reopen |


```json
{
  "is_completed": true
}
```



#### Success Response

**Status:** `200 OK`

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, and butter",
  "target_date": "2026-06-22",
  "target_time": "10:00",
  "is_completed": true,
  "completed_at": "2026-06-22T09:45:00Z",
  "category_id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
  "category": {
    "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
    "name": "Personal",
    "color": "#4CAF50"
  },
  "created_at": "2026-06-20T09:00:00Z",
  "updated_at": "2026-06-22T09:45:00Z"
}
```



#### Error Responses

**404 Not Found**

```json
{
  "detail": "Task not found.",
  "error_code": "NOT_FOUND"
}
```



#### Notes

- Setting `is_completed` to `true` automatically sets `completed_at` to the current server timestamp.
- Setting `is_completed` to `false` (reopening) clears `completed_at` back to `null`.

---



### DELETE /tasks/{task_id}

Permanently delete a task and its associated change log entries.


| Property          | Value                     |
| ----------------- | ------------------------- |
| **URL**           | `/api/v1/tasks/{task_id}` |
| **Method**        | `DELETE`                  |
| **Auth Required** | **Yes**                   |




#### Path Parameters


| Parameter | Type | Required | Description          |
| --------- | ---- | -------- | -------------------- |
| `task_id` | UUID | Yes      | The task's unique ID |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |




#### Success Response

**Status:** `204 No Content`

*No response body.*

#### Error Responses

**404 Not Found**

```json
{
  "detail": "Task not found.",
  "error_code": "NOT_FOUND"
}
```



#### Notes

- This action is **irreversible**. All change log entries associated with the task are also deleted (cascade).
- Returns `204` even if the task was already deleted (idempotent behavior) — though implementations may choose to return `404`.

---



## Endpoints — Task Change Log

---



### GET /tasks/{task_id}/changes

Retrieve the full change history for a task's `target_date` field. Each entry represents one date rescheduling event.


| Property          | Value                             |
| ----------------- | --------------------------------- |
| **URL**           | `/api/v1/tasks/{task_id}/changes` |
| **Method**        | `GET`                             |
| **Auth Required** | **Yes**                           |




#### Path Parameters


| Parameter | Type | Required | Description          |
| --------- | ---- | -------- | -------------------- |
| `task_id` | UUID | Yes      | The task's unique ID |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |




#### Success Response

**Status:** `200 OK`

```json
[
  {
    "id": "a8098c1a-f86e-11da-bd1a-00112444be1e",
    "task_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "old_date": "2026-06-22",
    "new_date": "2026-06-25",
    "change_reason": "Store is closed on the 22nd due to holiday",
    "changed_at": "2026-06-21T15:45:00Z"
  },
  {
    "id": "b7298c1a-a67e-22cb-ae2b-11223355cf2f",
    "task_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "old_date": "2026-06-20",
    "new_date": "2026-06-22",
    "change_reason": "Need more preparation time",
    "changed_at": "2026-06-19T10:20:00Z"
  }
]
```



#### Change Log Entry Schema


| Field           | Type     | Description                           |
| --------------- | -------- | ------------------------------------- |
| `id`            | UUID     | Unique change record identifier       |
| `task_id`       | UUID     | Associated task                       |
| `old_date`      | date     | Previous `target_date` value          |
| `new_date`      | date     | New `target_date` value               |
| `change_reason` | string   | User-supplied reason for the change   |
| `changed_at`    | datetime | Timestamp of when the change occurred |




#### Error Responses

**404 Not Found**

```json
{
  "detail": "Task not found.",
  "error_code": "NOT_FOUND"
}
```



#### Notes

- Results are ordered by `changed_at` **descending** (most recent change first).
- An empty array `[]` is returned if the task exists but has no date changes.

---



## Endpoints — Categories

---



### GET /categories

Retrieve all available task categories for the authenticated user.


| Property          | Value                |
| ----------------- | -------------------- |
| **URL**           | `/api/v1/categories` |
| **Method**        | `GET`                |
| **Auth Required** | **Yes**              |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |




#### Success Response

**Status:** `200 OK`

```json
[
  {
    "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
    "name": "Personal",
    "color": "#4CAF50"
  },
  {
    "id": "e4d909c2-90d0-4f0a-8ea7-43f5c1e8e0d7",
    "name": "Work",
    "color": "#2196F3"
  },
  {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Health",
    "color": "#FF5722"
  }
]
```



#### Category Object Schema


| Field   | Type   | Description                                 |
| ------- | ------ | ------------------------------------------- |
| `id`    | UUID   | Unique category identifier                  |
| `name`  | string | Category display name                       |
| `color` | string | Hex color code for UI rendering (`#RRGGBB`) |




#### Notes

- Categories may include both system-default categories and user-created categories.
- Results are ordered alphabetically by `name`.

---



## Endpoints — Analytics & Export

---



### GET /analytics/summary

Retrieve an aggregated analytics summary of the authenticated user's tasks.


| Property          | Value                       |
| ----------------- | --------------------------- |
| **URL**           | `/api/v1/analytics/summary` |
| **Method**        | `GET`                       |
| **Auth Required** | **Yes**                     |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |




#### Success Response

**Status:** `200 OK`

```json
{
  "total_tasks": 42,
  "completed_tasks": 30,
  "pending_tasks": 12,
  "completion_rate": 71.43,
  "overdue_tasks": 3,
  "tasks_by_category": [
    {
      "category_id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
      "category_name": "Personal",
      "total": 15,
      "completed": 12
    },
    {
      "category_id": "e4d909c2-90d0-4f0a-8ea7-43f5c1e8e0d7",
      "category_name": "Work",
      "total": 20,
      "completed": 14
    },
    {
      "category_id": null,
      "category_name": "Uncategorized",
      "total": 7,
      "completed": 4
    }
  ],
  "date_change_count": 8,
  "most_rescheduled_task": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Prepare presentation",
    "reschedule_count": 4
  }
}
```



#### Response Fields


| Field                   | Type   | Description                                                 |
| ----------------------- | ------ | ----------------------------------------------------------- |
| `total_tasks`           | int    | Total number of tasks                                       |
| `completed_tasks`       | int    | Number of completed tasks                                   |
| `pending_tasks`         | int    | Number of incomplete tasks                                  |
| `completion_rate`       | float  | Percentage of completed tasks (2 decimal places)            |
| `overdue_tasks`         | int    | Incomplete tasks where `target_date` is in the past         |
| `tasks_by_category`     | array  | Breakdown of task counts per category                       |
| `date_change_count`     | int    | Total number of date rescheduling events across all tasks   |
| `most_rescheduled_task` | object | Task with the highest number of date changes (null if none) |




#### Notes

- `overdue_tasks` counts tasks where `is_completed` is `false` and `target_date < today` (server's UTC date).
- `completion_rate` is `0.0` when `total_tasks` is `0`.

---



### GET /export/json

Export all of the authenticated user's tasks as a downloadable JSON file.


| Property          | Value                 |
| ----------------- | --------------------- |
| **URL**           | `/api/v1/export/json` |
| **Method**        | `GET`                 |
| **Auth Required** | **Yes**               |




#### Request Headers


| Header        | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | Bearer `<access_token>` | Yes      |




#### Success Response

**Status:** `200 OK`  
**Content-Type:** `application/json`  
**Content-Disposition:** `attachment; filename="tasks_export_2026-06-21.json"`

```json
{
  "exported_at": "2026-06-21T14:30:00Z",
  "user": {
    "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "email": "alice@example.com",
    "name": "Alice Johnson"
  },
  "total_tasks": 2,
  "tasks": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread, and butter",
      "target_date": "2026-06-22",
      "target_time": "10:00",
      "is_completed": false,
      "completed_at": null,
      "category": "Personal",
      "created_at": "2026-06-20T09:00:00Z",
      "updated_at": "2026-06-20T09:00:00Z",
      "change_history": []
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Prepare presentation",
      "description": null,
      "target_date": "2026-06-25",
      "target_time": "14:30",
      "is_completed": true,
      "completed_at": "2026-06-24T16:00:00Z",
      "category": "Work",
      "created_at": "2026-06-18T11:20:00Z",
      "updated_at": "2026-06-24T16:00:00Z",
      "change_history": [
        {
          "old_date": "2026-06-22",
          "new_date": "2026-06-25",
          "change_reason": "Client meeting moved",
          "changed_at": "2026-06-20T08:00:00Z"
        }
      ]
    }
  ]
}
```



#### Notes

- The export includes the **full change history** embedded within each task object for portability.
- The `category` field in the export is the category **name** (string), not the UUID — for human readability.
- The `Content-Disposition` header signals the browser to download the file rather than display it inline.

---



## Quick Reference


| Method   | Endpoint                    | Auth | Description                   |
| -------- | --------------------------- | ---- | ----------------------------- |
| `POST`   | `/auth/register`            | No   | Register a new account        |
| `POST`   | `/auth/login`               | No   | Log in with email & password  |
| `POST`   | `/auth/google`              | No   | Log in / register with Google |
| `POST`   | `/auth/refresh`             | No   | Refresh access token          |
| `GET`    | `/auth/me`                  | Yes  | Get current user profile      |
| `GET`    | `/tasks`                    | Yes  | List tasks (with filters)     |
| `GET`    | `/tasks/{task_id}`          | Yes  | Get a single task             |
| `POST`   | `/tasks`                    | Yes  | Create a task                 |
| `PUT`    | `/tasks/{task_id}`          | Yes  | Update a task                 |
| `PATCH`  | `/tasks/{task_id}/complete` | Yes  | Toggle task completion        |
| `DELETE` | `/tasks/{task_id}`          | Yes  | Delete a task                 |
| `GET`    | `/tasks/{task_id}/changes`  | Yes  | Get task date change history  |
| `GET`    | `/categories`               | Yes  | List categories               |
| `GET`    | `/analytics/summary`        | Yes  | Get analytics summary         |
| `GET`    | `/export/json`              | Yes  | Export all tasks as JSON      |




---



## Endpoints — Agent AI

All agent endpoints require a valid Bearer JWT token.
Responses may take 5–30 seconds depending on the agent invoked.
If `GEMINI_API_KEY` is not set, all endpoints return a development mock response.

---

### GET /agent/briefing

Generates a personalized AI morning briefing based on today's task state.

**Authentication:** Required  
**Response time:** 1–3s (cached after first call per session)

#### Response `200 OK`
```json
{
  "briefing": "Good morning! You have 4 tasks today including 'Kaggle EDA script'. 2 tasks are overdue — consider asking the AI Chat to reschedule them."
}
```

#### Response `401 Unauthorized`
```json
{ "detail": "Not authenticated" }
```

#### Response `504 Gateway Timeout`
```json
{ "detail": "The Daily Briefing agent timed out. Please try again later." }
```

---

### POST /agent/suggest-subtasks

Generates 3–5 actionable subtasks for a given task using Gemini.

**Authentication:** Required  
**Response time:** 1–3s (direct Gemini call, no ADK tool loop)

#### Request Body
```json
{
  "title": "Submit conference paper",
  "description": "NeurIPS 2026 submission — due in 3 weeks"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Task title |
| `description` | string | ❌ | Optional task description for more context |

#### Response `200 OK`
```json
{
  "subtasks": [
    "Research and review related NeurIPS 2024–2025 papers",
    "Write abstract and introduction",
    "Complete methodology and experiments section",
    "Run final evaluation and collect benchmark results",
    "Proofread, format per template, and submit via CMT"
  ]
}
```

---

### POST /agent/insights

Triggers the ADK 2.0 Analytics Coach agent. Queries the user's real task database and returns a productivity coaching report.

**Authentication:** Required  
**Response time:** 5–15s (ADK tool loop + Gemini)

#### Request Body
```json
{
  "message": "Give me coaching advice. What categories should I focus on?"
}
```

| Field | Type | Required | Default |
|---|---|---|---|
| `message` | string | ❌ | `"Analyze my current task execution statistics and give me coaching advice."` |

#### Response `200 OK`
```json
{
  "response": "Your completion rate is 75.3%, which is strong! However, your 'Health' category has only 2 of 9 tasks completed — this is your biggest gap. You've rescheduled 12 tasks this week, mostly in 'Work', suggesting possible overcommitment. Consider reducing daily Work tasks from 5 to 3."
}
```

#### Response `504 Gateway Timeout`
```json
{ "detail": "The Productivity Coach agent timed out. Please try again later." }
```

---

### POST /agent/plan

Triggers the ADK 2.0 Task Planner agent. Creates a new category and structured tasks from a natural language goal. **Mutates the database.**

**Authentication:** Required  
**Response time:** 15–45s (multi-step tool loop: categories + task creation)

#### Request Body
```json
{
  "message": "Plan my preparation for a Kaggle ML competition over 3 weeks"
}
```

| Field | Type | Required | Default |
|---|---|---|---|
| `message` | string | ❌ | `"Break down my goal to launch my Kaggle competition model in 3 weeks into structured tasks."` |

#### Response `200 OK`
```json
{
  "response": "I've created a 'Kaggle ML Prep' category and added 6 tasks:\n1. EDA and data understanding (Jul 7)\n2. Baseline model (Jul 9)\n3. Feature engineering (Jul 11)\n4. Model tuning (Jul 14)\n5. Cross-validation strategy (Jul 18)\n6. Final submission preparation (Jul 24)\n\nCheck your Tasks page under the new category!"
}
```

> **Side effects:** Creates rows in `categories` and `tasks` tables. Each creation is logged via `TaskChangeLog` when dates are changed later.

#### Response `504 Gateway Timeout`
```json
{ "detail": "The Task Planner agent timed out. Please try again later." }
```

---

### POST /agent/reschedule

Triggers the ADK 2.0 Rescheduler agent. Scans for overdue or chronically delayed tasks and redistributes them across future dates. **Mutates the database.**

**Authentication:** Required  
**Response time:** 10–30s (multi-step: scan + reschedule loop)

#### Request Body
```json
{
  "message": "Optimize my overdue and chronically rescheduled tasks."
}
```

| Field | Type | Required | Default |
|---|---|---|---|
| `message` | string | ❌ | `"Optimize my overdue and chronically rescheduled tasks."` |

#### Response `200 OK`
```json
{
  "response": "I've redistributed 5 overdue tasks:\n- 'Kaggle EDA' → Jul 7 (was Jun 28, rescheduled 3x)\n- 'Write report' → Jul 8 (overdue 9 days)\n- 'Fix auth bug' → Jul 9\n- 'Review PRs' → Jul 10\n- 'Update docs' → Jul 11\n\nAll changes are logged in your task audit history."
}
```

> **Side effects:** Updates `target_date` in `tasks` table. Inserts rows into `task_change_log` with AI-generated reasons.

#### Response `504 Gateway Timeout`
```json
{ "detail": "The Rescheduler agent timed out. Please try again later." }
```

---

### POST /agent/chat

The master Orchestrator agent. Routes natural language messages to the appropriate sub-agent (Analytics Coach, Task Planner, or Rescheduler) or responds directly for general chat.

**Authentication:** Required  
**Response time:** 5–30s (depends on which agent is invoked)

#### Request Body
```json
{
  "message": "I'm overwhelmed — reschedule my overdue tasks"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string | ✅ | Natural language message |

#### Routing Logic
| Keywords in message | Agent invoked |
|---|---|
| stats, productivity, completion, trends, coaching | Analytics Coach |
| plan, organize, prepare, schedule, project, goal | Task Planner |
| overdue, overwhelmed, reschedule, optimize, behind | Rescheduler |
| hello, help, general chat | Orchestrator responds directly |

#### Response `200 OK`
```json
{
  "response": "I've redistributed your 5 overdue tasks across the next 5 days. Each has a logged reason. Check your Dashboard to see the updated schedule."
}
```

#### Response `504 Gateway Timeout`
```json
{ "detail": "The Orchestrator agent timed out. Please try again later." }
```
