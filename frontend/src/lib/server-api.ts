import { getServerApiBase } from "./api-base";

interface ServerFetchOptions extends RequestInit {
    skipAuth?: boolean;
}

/**
 * Server-side fetch helper for SSR/RSC. Requests go through the Next.js
 * /api/v1 proxy, which forwards to FastAPI on the internal Docker network.
 */
export async function serverFetch(
    path: string,
    options: ServerFetchOptions = {}
): Promise<Response> {
    const base = await getServerApiBase();
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    return fetch(url, {
        ...options,
        headers,
    });
}

export async function serverGet<T = unknown>(
    path: string,
    options: ServerFetchOptions = {}
): Promise<T> {
    const response = await serverFetch(path, { ...options, method: "GET" });

    if (response.status === 204) {
        return null as T;
    }

    const data = await response.json();

    if (!response.ok) {
        throw {
            status: response.status,
            message: data.detail || "Something went wrong",
            errorCode: data.error_code || "UNKNOWN_ERROR",
        };
    }

    return data as T;
}
