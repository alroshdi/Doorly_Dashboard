"use client";

const AUTH_KEY = "doorly_auth";

export interface AuthUser {
  email: string;
  isAuthenticated: boolean;
}

export function setAuth(email: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ email, isAuthenticated: true }));
  }
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const auth = localStorage.getItem(AUTH_KEY);
  if (!auth) return null;
  try {
    return JSON.parse(auth);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function isAuthenticated(): boolean {
  const auth = getAuth();
  return auth?.isAuthenticated === true;
}


