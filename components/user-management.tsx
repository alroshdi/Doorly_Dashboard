"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { 
  User, 
  UserPlus, 
  Edit, 
  Trash2, 
  X, 
  Save,
  Shield,
  Eye,
  FileEdit
} from "lucide-react";
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  type User as UserType,
  type UserRole,
  type Permission,
  ROLE_PERMISSIONS
} from "@/lib/user-management";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface UserManagementProps {
  isRTL?: boolean;
}

export function UserManagement({ isRTL = false }: UserManagementProps) {
  const lang = getLanguage();
  const t = getTranslations(lang);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as UserRole,
    permissions: [] as Permission[],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "viewer",
      permissions: [],
    });
    setEditingUser(null);
    setError("");
    setSuccess("");
  };

  const handleOpenModal = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: "", // Don't show password
        role: user.role,
        permissions: user.permissions,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData({
      ...formData,
      role,
      permissions: ROLE_PERMISSIONS[role], // Auto-set permissions based on role
    });
  };

  const togglePermission = (permission: Permission) => {
    if (formData.permissions.includes(permission)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter((p) => p !== permission),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingUser) {
        // Update existing user
        const updates: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          permissions: formData.permissions,
        };
        if (formData.password) {
          updates.password = formData.password;
        }
        updateUser(editingUser.id, updates);
        setSuccess(t.users.userUpdated);
      } else {
        // Create new user
        if (!formData.password) {
          setError(isRTL ? "كلمة المرور مطلوبة" : "Password is required");
          return;
        }
        createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          permissions: formData.permissions,
        });
        setSuccess(t.users.userCreated);
      }
      
      loadUsers();
      setTimeout(() => {
        handleCloseModal();
      }, 1000);
    } catch (err: any) {
      setError(err.message || (isRTL ? "حدث خطأ" : "An error occurred"));
    }
  };

  const handleDelete = (userId: string) => {
    if (!confirm(t.users.confirmDelete)) return;

    try {
      deleteUser(userId);
      setSuccess(t.users.userDeleted);
      loadUsers();
    } catch (err: any) {
      setError(err.message || (isRTL ? "حدث خطأ" : "An error occurred"));
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "editor":
        return <FileEdit className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "editor":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "viewer":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t.users.title}
            </CardTitle>
            <CardDescription>{t.users.subtitle}</CardDescription>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <UserPlus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t.users.addUser}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm">
            {success}
          </div>
        )}

        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.users.noUsers}
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all duration-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.name}</h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                          getRoleColor(user.role)
                        )}
                      >
                        {getRoleIcon(user.role)}
                        {t.users[user.role]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="text-xs px-2 py-0.5 bg-muted rounded"
                        >
                          {t.users[perm]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(user)}
                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {user.email !== "admin@admin.com" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal - Rendered in Portal */}
        {isModalOpen && typeof window !== "undefined" && createPortal(
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" 
            style={{ zIndex: 9999 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseModal();
              }
            }}
          >
            <Card 
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl animate-scale-in" 
              style={{ zIndex: 10000 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingUser ? t.users.editUser : t.users.addUser}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t.users.name}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.users.email}</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      {t.users.password}
                      {editingUser && (
                        <span className="text-muted-foreground text-xs ml-2">
                          ({isRTL ? "اتركه فارغاً للحفاظ على كلمة المرور الحالية" : "Leave empty to keep current password"})
                        </span>
                      )}
                    </Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required={!editingUser}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.users.role}</Label>
                    <Select
                      value={formData.role}
                      onChange={(e) =>
                        handleRoleChange(e.target.value as UserRole)
                      }
                    >
                      <option value="admin">{t.users.admin}</option>
                      <option value="editor">{t.users.editor}</option>
                      <option value="viewer">{t.users.viewer}</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.users.permissions}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-lg">
                      {(
                        [
                          "dashboard",
                          "linkedin",
                          "customers",
                          "settings",
                          "users",
                          "reports",
                        ] as Permission[]
                      ).map((perm) => (
                        <label
                          key={perm}
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                            className="rounded"
                          />
                          <span className="text-sm">{t.users[perm]}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseModal}
                    >
                      {t.users.cancel}
                    </Button>
                    <Button type="submit">
                      <Save className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                      {t.users.save}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>,
          document.body
        )}
      </CardContent>
    </Card>
  );
}

