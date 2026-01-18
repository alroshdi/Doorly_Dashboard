"use client";

import { User, UserRole, getAuth } from "./auth";

const USERS_STORAGE_KEY = "doorly_users";

// Initialize with default admin user if no users exist
const DEFAULT_ADMIN: User = {
  id: "1",
  name: "Admin",
  email: "admin@admin.com",
  role: "admin",
  status: "active",
  createdAt: new Date().toISOString(),
};

export function getUsers(): User[] {
  if (typeof window === "undefined") return [DEFAULT_ADMIN];
  
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    // Initialize with default admin
    const users = [DEFAULT_ADMIN];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return users;
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return [DEFAULT_ADMIN];
  }
}

export function saveUsers(users: User[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
}

export function addUser(user: Omit<User, "id" | "createdAt">): User {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(userId: string, updates: Partial<Omit<User, "id" | "createdAt">>): User | null {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return null;
  
  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return users[index];
}

export function deleteUser(userId: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  
  saveUsers(filtered);
  return true;
}

export function getUserById(userId: string): User | null {
  const users = getUsers();
  return users.find(u => u.id === userId) || null;
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  
  const auth = getAuth();
  if (!auth) return null;
  
  const users = getUsers();
  return users.find(u => u.email === auth.email) || null;
}

