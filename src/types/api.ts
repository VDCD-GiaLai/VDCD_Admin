/**
 * Generic wrapper for all NestJS success responses.
 * Shape: { statusCode: number; data: T }
 */
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

/**
 * Paginated list response from NestJS.
 * Used by all list endpoints (programs, solutions, projects, etc.)
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Error response shape from NestJS.
 * `message` can be a string or array of validation messages.
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}
