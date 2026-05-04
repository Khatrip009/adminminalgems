// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import type { AuthUser } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "mg_admin_token";
const USER_KEY = "mg_admin_user";

// Helper: parse JWT without external library
function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Helper: check if token is expired
function isTokenExpired(token: string): boolean {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  const expiryMs = decoded.exp * 1000;
  return Date.now() >= expiryMs;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors during logout
    }
    clearAuth();
    // ✅ Soft navigation – works perfectly with HashRouter
    navigate("/login", { replace: true });
  }, [clearAuth, navigate]);

  // Periodically check token expiry (every 60 seconds)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        logout();
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [token, logout]);

  // On mount: validate stored token
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Immediate expiry check
      if (isTokenExpired(storedToken)) {
        await logout();
        setLoading(false);
        return;
      }

      try {
        const me = await apiFetch("/auth/me");
        if (me?.user?.role_id === 1) {
          setUser(me.user);
          setToken(storedToken);
        } else {
          await logout();
        }
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once

  const login = async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (!data.ok) throw new Error(data.error || "Login failed");

    const u = data.user;
    if (Number(u.role_id) !== 1) {
      throw new Error("Access denied. Admins only.");
    }

    setUser(u);
    setToken(data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const value: AuthContextValue = { user, token, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}