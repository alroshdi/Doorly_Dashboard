"use client";

export type UserRole = "admin" | "editor" | "viewer";
export type Permission = "dashboard" | "linkedin" | "customers" | "settings" | "users" | "reports";

export interface User {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  name: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

const USERS_KEY = "doorly_users";
const DEFAULT_ADMIN: User = {
  id: "admin-1",
  email: "admin@admin.com",
  password: "admin123", // In production, hash this
  name: "Admin User",
  role: "admin",
  permissions: ["dashboard", "linkedin", "customers", "settings", "users", "reports"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Initialize users with default admin if empty
function initializeUsers(): User[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    try {
      const users = JSON.parse(stored);
      // Check if admin exists
      const adminExists = users.some((u: User) => u.email === DEFAULT_ADMIN.email);
      if (!adminExists) {
        users.push(DEFAULT_ADMIN);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return users;
      }
      return users;
    } catch {
      // If parse fails, initialize with default admin
      const users = [DEFAULT_ADMIN];
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return users;
    }
  }
  
  // First time - initialize with default admin
  const users = [DEFAULT_ADMIN];
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
}

export function getAllUsers(): User[] {
  return initializeUsers();
}

export function getUserByEmail(email: string): User | null {
  const users = getAllUsers();
  return users.find((u) => u.email === email) || null;
}

export function getUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): User {
  const users = getAllUsers();
  
  // Check if email already exists
  if (users.some((u) => u.email === userData.email)) {
    throw new Error("User with this email already exists");
  }
  
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
}

export function updateUser(id: string, updates: Partial<Omit<User, "id" | "createdAt">>): User {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  
  if (index === -1) {
    throw new Error("User not found");
  }
  
  // Check if email is being changed and already exists
  if (updates.email && users.some((u, i) => u.email === updates.email && i !== index)) {
    throw new Error("User with this email already exists");
  }
  
  const updatedUser: User = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  users[index] = updatedUser;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return updatedUser;
}

export function deleteUser(id: string): void {
  const users = getAllUsers();
  
  // Prevent deleting the default admin
  const user = users.find((u) => u.id === id);
  if (user && user.email === DEFAULT_ADMIN.email) {
    throw new Error("Cannot delete default admin user");
  }
  
  const filtered = users.filter((u) => u.id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
}

export function verifyUser(email: string, password: string): User | null {
  const user = getUserByEmail(email);
  if (!user) return null;
  
  // In production, compare hashed passwords
  if (user.password !== password) return null;
  
  return user;
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === "admin") return true; // Admin has all permissions
  return user.permissions.includes(permission);
}

export function canManageUsers(user: User | null): boolean {
  return hasPermission(user, "users") || user?.role === "admin";
}

// Role definitions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ["dashboard", "linkedin", "customers", "settings", "users", "reports"],
  editor: ["dashboard", "linkedin", "customers", "reports"],
  viewer: ["dashboard", "linkedin"],
};











