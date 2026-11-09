/**
 * Browser-side helper for calling the Macrocenter API. Server components use
 * their own base URL (see product-service.ts); everything that runs in the
 * browser goes through `apiFetch`.
 */

/** Read by the browser, so it must be the host-visible API address. */
export const BROWSER_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/** An error response from the API, with a message fit to show a user. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Bearer token. Omit for public endpoints. */
  token?: string | null;
}

/** Turns an RFC 7807 problem document into one readable sentence. */
function problemMessage(problem: ProblemDetails | null, status: number): string {
  const firstValidationError = problem?.errors
    ? Object.values(problem.errors).flat()[0]
    : undefined;

  return (
    firstValidationError ??
    problem?.detail ??
    problem?.title ??
    `The request failed (${status}).`
  );
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BROWSER_API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the API running?", 0);
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw new ApiError(problemMessage(problem, response.status), response.status);
  }

  // 204 No Content (deletes) has no body to parse.
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
