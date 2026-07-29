/**
 * API Client — centralized axios wrapper.
 *
 * Two modes:
 * - Server-side (Route Handlers): `apiFetch` calls NestJS directly via API_BASE_URL
 * - Client-side (components): `clientFetch` calls BFF route handlers at /api/*
 *
 * Client-side auto-refresh: on 401, tries POST /api/auth/refresh once,
 * then retries the original request. If still 401, redirects to /login.
 */

import axios, {
  type AxiosRequestConfig,
  type AxiosError,
  type AxiosResponse,
} from "axios";

const API_BASE_URL = process.env.API_BASE_URL ?? "";

// ─── Axios instances ─────────────────────────────────────────

/** Server-side instance — calls NestJS directly via API_BASE_URL */
const serverAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/** Client-side instance — calls BFF route handlers at /api/* */
const clientAxios = axios.create({
  headers: { "Content-Type": "application/json" },
});

// ─── Error class ─────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Convert a `RequestInit` (fetch style) to `AxiosRequestConfig`.
 * Keeps backward compatibility with existing consumers.
 */
function toAxiosConfig(init?: RequestInit): AxiosRequestConfig {
  if (!init) return {};

  const config: AxiosRequestConfig = {};

  if (init.method) config.method = init.method;
  if (init.headers) {
    config.headers =
      init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init.headers as Record<string, string>);
  }
  if (init.body) {
    config.data =
      typeof init.body === "string" ? JSON.parse(init.body) : init.body;
  }
  if (init.signal) config.signal = init.signal as AbortSignal;

  return config;
}

/**
 * Extract a user-friendly error message from an Axios error response.
 */
function extractErrorMessage(error: AxiosError<{ message?: string | string[] }>): string {
  const body = error.response?.data;
  if (typeof body?.message === "string") return body.message;
  if (Array.isArray(body?.message)) return body.message.join(", ");
  return "Request failed";
}

// ─── Server-side fetch (Route Handlers → NestJS) ────────────

/**
 * Used inside Route Handlers to call NestJS directly.
 * NOT for use in client components — use `clientFetch` instead.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  try {
    const config = toAxiosConfig(init);
    const res: AxiosResponse = await serverAxios(path, config);
    return res.data?.data ?? res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      throw new ApiError(
        err.response.status,
        extractErrorMessage(err),
        err.response.data
      );
    }
    throw err;
  }
}

// ─── Client-side fetch (components → BFF route handlers) ────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token via the BFF endpoint.
 * Returns true if refresh succeeded, false otherwise.
 * Deduplicates concurrent refresh attempts.
 */
async function tryRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = clientAxios
    .post("/api/auth/refresh")
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Client-side fetch wrapper for calling BFF route handlers.
 * Used in TanStack Query hooks inside client components.
 *
 * - Calls /api/* endpoints (not NestJS directly)
 * - On 401: tries refresh once, retries original request
 * - If refresh fails: hard redirect to /login
 */
export async function clientFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const config = toAxiosConfig(init);

  const doRequest = (): Promise<AxiosResponse> =>
    clientAxios(path, config);

  try {
    const res = await doRequest();
    return res.data?.data ?? res.data;
  } catch (err) {
    // Auto-refresh on 401
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        try {
          const res = await doRequest();
          return res.data?.data ?? res.data;
        } catch (retryErr) {
          if (axios.isAxiosError(retryErr) && retryErr.response) {
            throw new ApiError(
              retryErr.response.status,
              extractErrorMessage(retryErr),
              retryErr.response.data
            );
          }
          throw retryErr;
        }
      } else {
        // Refresh failed — redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new ApiError(401, "Phiên đăng nhập đã hết hạn");
      }
    }

    if (axios.isAxiosError(err) && err.response) {
      throw new ApiError(
        err.response.status,
        extractErrorMessage(err),
        err.response.data
      );
    }
    throw err;
  }
}