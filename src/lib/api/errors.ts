// Centralised, safe error shapes for every backend surface.
// Never include stack traces, SQL text, or secrets in `message`.

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({ ok: false, error: { code: this.code, message: this.message, details: this.details } }),
      { status: this.status, headers: { "content-type": "application/json" } },
    );
  }
}

export const badRequest = (m: string, d?: unknown) => new ApiError("VALIDATION_ERROR", m, d);
export const unauthenticated = (m = "Authentication required") => new ApiError("UNAUTHENTICATED", m);
export const forbidden = (m = "Permission denied") => new ApiError("FORBIDDEN", m);
export const notFound = (m = "Resource not found") => new ApiError("NOT_FOUND", m);
export const conflict = (m: string) => new ApiError("CONFLICT", m);
export const rateLimited = (m = "Too many requests. Please try again later.") =>
  new ApiError("RATE_LIMITED", m);

/** Log the real cause server-side, return a safe error to the caller. */
export function internalError(cause: unknown, publicMessage = "Something went wrong. Please try again."): ApiError {
  console.error("[api]", cause);
  return new ApiError("INTERNAL_ERROR", publicMessage);
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) return error.toResponse();
  return internalError(error).toResponse();
}

export type ApiSuccess<T> = { ok: true; data: T };
export const ok = <T>(data: T): ApiSuccess<T> => ({ ok: true, data });
