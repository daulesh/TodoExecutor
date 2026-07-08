const DEFAULT_BROWSER_API_BASE = "/api/v1";

/**
 * Base URL for browser-side API calls. Uses the Next.js proxy path so requests
 * stay on the same origin and are forwarded to FastAPI internally.
 */
export function getBrowserApiBase(): string {
    return process.env.NEXT_PUBLIC_API_BASE || DEFAULT_BROWSER_API_BASE;
}

/**
 * Base URL for server-side (SSR/RSC) API calls. Routes through the Next.js
 * proxy using the incoming request host so SSR and browser share the same path.
 */
export async function getServerApiBase(): Promise<string> {
    const { headers } = await import("next/headers");
    const headersList = await headers();

    const host =
        headersList.get("x-forwarded-host") ||
        headersList.get("host");

    const protocol =
        headersList.get("x-forwarded-proto") ||
        (process.env.NODE_ENV === "production" ? "https" : "http");

    if (host) {
        return `${protocol}://${host}${DEFAULT_BROWSER_API_BASE}`;
    }

    const internalFrontendUrl =
        process.env.INTERNAL_FRONTEND_URL || "http://localhost:3000";

    return `${internalFrontendUrl}${DEFAULT_BROWSER_API_BASE}`;
}

/**
 * Resolves the API base URL for the current runtime (browser vs server).
 */
export async function getApiBase(): Promise<string> {
    if (typeof window !== "undefined") {
        return getBrowserApiBase();
    }

    return getServerApiBase();
}
