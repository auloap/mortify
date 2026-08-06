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
