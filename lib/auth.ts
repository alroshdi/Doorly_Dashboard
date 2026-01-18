"use client";

const AUTH_KEY = "doorly_auth";
const USER_KEY = "doorly_user";

export type UserRole = "admin" | "analyst" | "viewer";

export interface AuthUser {
  email: string;
  isAuthenticated: boolean;
  role?: UserRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "disabled";
  avatarUrl?: string;
  createdAt: string;
}

export function setAuth(email: string, role: UserRole = "admin"): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ email, isAuthenticated: true, role }));
  }
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const auth = localStorage.getItem(AUTH_KEY);
  if (!auth) return null;
  try {
    const parsed = JSON.parse(auth);
    return { ...parsed, role: parsed.role || "admin" };
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

export function getUserRole(): UserRole {
  const auth = getAuth();
  return auth?.role || "viewer";
}

export function isAdmin(): boolean {
  return getUserRole() === "admin";
}

export function canManageUsers(): boolean {
  return isAdmin();
}


