import { api } from "@/lib/fetcher";

export interface AgentUsageSummary {
    monthly_quota: number | null;
    tokens_used_this_month: number;
    tokens_remaining: number | null;
    percent_used: number | null;
    quota_enabled: boolean;
    model: string;
    period_start: string;
}

export const LLM_USAGE_UPDATED_EVENT = "llm_usage_updated";

export function notifyLlmUsageUpdated() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(LLM_USAGE_UPDATED_EVENT));
    }
}

export async function getAgentUsage(): Promise<AgentUsageSummary> {
    return api.get("/agent/usage");
}

export async function getBriefing(): Promise<string> {
    const res = await api.get("/agent/briefing");
    notifyLlmUsageUpdated();
    return res.briefing;
}

export async function generatePlan(message: string): Promise<string> {
    const res = await api.post("/agent/plan", { message });
    notifyLlmUsageUpdated();
    return res.response;
}

export async function getInsights(message: string): Promise<string> {
    const res = await api.post("/agent/insights", { message });
    notifyLlmUsageUpdated();
    return res.response;
}

export async function sendChat(message: string): Promise<string> {
    const res = await api.post("/agent/chat", { message });
    notifyLlmUsageUpdated();
    return res.response;
}

export async function suggestSubtasks(title: string, description: string = ""): Promise<string[]> {
    const res = await api.post("/agent/suggest-subtasks", { title, description });
    notifyLlmUsageUpdated();
    return res;
}

export function isQuotaExceededError(err: unknown): boolean {
    return (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        (err as { status: number }).status === 429
    );
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === "object" && err !== null && "message" in err) {
        return String((err as { message: string }).message);
    }
    return fallback;
}
