"use client";

import { User, getUserByEmail } from "./user-management";

const AUTH_KEY = "doorly_auth";

export interface AuthUser {
  email: string;
  userId?: string;
  role?: string;
  isAuthenticated: boolean;
}

export function setAuth(email: string, userId?: string, role?: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ 
      email, 
      userId,
      role,
      isAuthenticated: true 
    }));
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

export function getCurrentUser(): User | null {
  const auth = getAuth();
  if (!auth?.email) return null;
  return getUserByEmail(auth.email);
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

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === "admin";
}


