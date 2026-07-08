import { api } from "@/lib/fetcher";
import type { Category, Task, TaskDetail } from "@/types";

export async function getCategories(): Promise<Category[]> {
    return api.get("/categories");
}

export async function getTasks(date?: string): Promise<Task[]> {
    const path = date ? `/tasks?date=${date}` : "/tasks";
    return api.get(path);
}

export async function getTask(taskId: string): Promise<TaskDetail> {
    return api.get(`/tasks/${taskId}`);
}

export async function createTask(body: Record<string, unknown>): Promise<Task> {
    return api.post("/tasks", body);
}

export async function updateTask(taskId: string, body: Record<string, unknown>): Promise<TaskDetail> {
    return api.put(`/tasks/${taskId}`, body);
}

export async function deleteTask(taskId: string): Promise<void> {
    return api.delete(`/tasks/${taskId}`);
}

export async function completeTask(
    taskId: string,
    body: {
        is_completed: boolean;
        actual_duration_minutes: number | null;
        completion_notes: string | null;
    }
): Promise<Task> {
    return api.patch(`/tasks/${taskId}/complete`, body);
}

export async function getSubtaskSuggestions(taskId: string): Promise<string[]> {
    const res = await api.post(`/agent/subtasks/${taskId}`, {});
    return res.suggestions ?? [];
}
