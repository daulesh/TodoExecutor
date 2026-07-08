import { api } from "@/lib/fetcher";
import type { AnalyticsData } from "@/types";

export async function getAnalyticsSummary(): Promise<AnalyticsData> {
    return api.get("/analytics/summary");
}

export async function exportWorkspaceJson(): Promise<unknown> {
    return api.get("/export/json");
}
