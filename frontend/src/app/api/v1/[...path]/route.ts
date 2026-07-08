import { NextRequest, NextResponse } from "next/server";

const BACKEND_INTERNAL_URL =
    process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

const FORWARD_REQUEST_HEADERS = [
    "authorization",
    "content-type",
    "accept",
    "accept-language",
    "cookie",
];

const FORWARD_RESPONSE_HEADERS = [
    "content-type",
    "content-disposition",
    "cache-control",
];

function buildBackendUrl(pathSegments: string[], search: string): string {
    const path = pathSegments.length > 0 ? pathSegments.join("/") : "";
    const backendPath = path ? `/api/v1/${path}` : "/api/v1";
    const url = new URL(backendPath, BACKEND_INTERNAL_URL);
    url.search = search;
    return url.toString();
}

function pickHeaders(
    source: Headers,
    allowed: string[]
): Headers {
    const headers = new Headers();

    for (const name of allowed) {
        const value = source.get(name);
        if (value) {
            headers.set(name, value);
        }
    }

    return headers;
}

async function proxyToBackend(
    request: NextRequest,
    pathSegments: string[]
): Promise<NextResponse> {
    const backendUrl = buildBackendUrl(pathSegments, request.nextUrl.search);
    const headers = pickHeaders(request.headers, FORWARD_REQUEST_HEADERS);

    const init: RequestInit & { duplex?: "half" } = {
        method: request.method,
        headers,
        redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = request.body;
        init.duplex = "half";
    }

    let backendResponse: Response;

    try {
        backendResponse = await fetch(backendUrl, init);
    } catch (error) {
        console.error("API proxy error:", error);
        return NextResponse.json(
            {
                detail: "Backend service unavailable",
                error_code: "BACKEND_UNAVAILABLE",
            },
            { status: 502 }
        );
    }

    const responseHeaders = pickHeaders(
        backendResponse.headers,
        FORWARD_RESPONSE_HEADERS
    );

    return new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        headers: responseHeaders,
    });
}

type RouteContext = {
    params: Promise<{ path: string[] }>;
};

async function handleProxy(
    request: NextRequest,
    context: RouteContext
): Promise<NextResponse> {
    const { path } = await context.params;
    return proxyToBackend(request, path ?? []);
}

export async function GET(request: NextRequest, context: RouteContext) {
    return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
    return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
    return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    return handleProxy(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
    return handleProxy(request, context);
}
