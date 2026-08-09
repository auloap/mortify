import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch, apiJson } from "./api";
import { getStoredToken, setStoredToken, clearStoredToken } from "./session";

interface Identity {
  userId: string;
  email: string;
}

interface AuthContextValue {
  identity: Identity | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse {
  token: string;
  userId: string;
  email: string;
}

async function callAuthRoute(path: string, email: string, password: string): Promise<AuthResponse> {
  const res = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Something went wrong");
  return body as AuthResponse;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      if (!token) { setLoading(false); return; }
      try {
        const me = await apiJson<Identity>("/api/auth/me");
        setIdentity(me);
      } catch {
        await clearStoredToken();
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await callAuthRoute("/api/auth/login", email, password);
    await setStoredToken(res.token);
    setIdentity({ userId: res.userId, email: res.email });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await callAuthRoute("/api/auth/register", email, password);
    await setStoredToken(res.token);
    setIdentity({ userId: res.userId, email: res.email });
  }, []);

  const logout = useCallback(async () => {
    try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch {}
    await clearStoredToken();
    setIdentity(null);
  }, []);

  return (
    <AuthContext.Provider value={{ identity, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
