import { getStoredToken } from "./session";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export function apiFetch(path: string, init: RequestInit = {}) {
  return getStoredToken().then(token =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  );
}

/**
 * Same as apiFetch, but throws instead of returning a parsed error body.
 *
 * A failed request answers with {error:"..."}, not the entity the caller asked
 * for. Handing that object back would let it reach list state, where the next
 * render maps over it and takes the whole app down. Callers must catch.
 */
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}
