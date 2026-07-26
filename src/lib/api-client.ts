const API_BASE_URL = process.env.API_BASE_URL ?? "";

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public payload?: unknown
    ) {
        super(message);
    }
}

export async function apiFetch<T>(
    path: string,
    init?: RequestInit
): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        credentials: "include", // send with cookie httpOnly
        headers: {
            "Content-Type": "application/json",
            ...init?.headers,
        },
    });

    if (res.status === 401) {
        // TODO Phase 1: try refresh token 1 time via /api/auth/refresh then retry
        throw new ApiError(401, "Unauthorized");
    }

    if (!res.ok) {
        const body = await res.json().catch(() => undefined);
        throw new ApiError(res.status, body?.message ?? "Request failed", body);
    }

    // API return { statusCode, data, message } - return data directly
    const json = await res.json();
    return json.data ?? json;
}