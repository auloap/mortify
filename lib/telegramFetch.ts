declare global {
  interface Window {
    Telegram?: { WebApp?: { initData?: string } };
  }
}

export function tgFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const initData = typeof window !== "undefined" ? window.Telegram?.WebApp?.initData ?? "" : "";
  return fetch(input, {
    ...init,
    headers: { ...(init.headers || {}), "x-telegram-init-data": initData },
  });
}

/**
 * Same as tgFetch, but throws instead of returning a parsed error body.
 *
 * A failed request answers with {error:"..."}, not the entity the caller asked
 * for. Handing that object back would let it reach list state, where the next
 * render maps over it and takes the whole app down. Callers must catch.
 */
export async function tgJson<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const res = await tgFetch(input, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}
