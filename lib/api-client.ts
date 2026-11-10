export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

/**
 * GET a JSON endpoint of this app. Never throws: network failures come back
 * as status 0 so callers can show an error state instead of an empty one.
 */
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: unknown };
        if (typeof body.error === "string") message = body.error;
      } catch {
        // Non-JSON error body.
      }
      return { ok: false, status: res.status, message };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { ok: false, status: 0, message: "Network error. Check your connection." };
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Client-side state of something being fetched. */
export type Load<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error"; message: string };
