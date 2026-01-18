"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { User, UserRole } from "@/lib/auth";
import { getUsers, addUser, updateUser, deleteUser, getUserById, getCurrentUser } from "@/lib/user-management";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { Users, Plus, Edit, Trash2, X, Save, UserCircle, Shield, Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserManagementProps {
  isRTL: boolean;
}

export function UserManagement({ isRTL }: UserManagementProps) {
  const lang = getLanguage();
  const t = getTranslations(lang);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as UserRole,
    status: "active" as "active" | "disabled",
    avatarUrl: "",
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
    // Get current user only on client side
    if (typeof window !== "undefined") {
      setCurrentUser(getCurrentUser());
    }
  }, []);

  const loadUsers = () => {
    setUsers(getUsers());
    // Update current user when users list changes
    if (typeof window !== "undefined") {
      setCurrentUser(getCurrentUser());
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "viewer",
      status: "active",
      avatarUrl: "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl || "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "viewer",
      status: "active",
      avatarUrl: "",
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t.userManagement.form.nameRequired;
    }

    if (!formData.email.trim()) {
      errors.email = t.userManagement.form.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t.userManagement.form.emailInvalid;
    } else {
      // Check if email exists (excluding current user if editing)
      const existingUser = users.find(u => u.email === formData.email);
      if (existingUser && existingUser.id !== editingUser?.id) {
        errors.email = t.userManagement.errors.emailExists;
      }
    }

    if (!editingUser && !formData.password) {
      errors.password = t.userManagement.form.passwordRequired;
    } else if (formData.password && formData.password.length < 6) {
      errors.password = t.userManagement.form.passwordMinLength;
    }

    if (!formData.role) {
      errors.role = t.userManagement.form.roleRequired;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (editingUser) {
      // Prevent admin from demoting themselves
      if (currentUser?.id === editingUser.id && editingUser.role === "admin" && formData.role !== "admin") {
        setFormErrors({ role: t.userManagement.errors.cannotDemoteSelf });
        return;
      }

      updateUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        avatarUrl: formData.avatarUrl || undefined,
      });
    } else {
      addUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        avatarUrl: formData.avatarUrl || undefined,
      });
    }

    loadUsers();
    handleCloseModal();
  };

  const handleDelete = (userId: string) => {
    // Prevent admin from deleting themselves
    if (currentUser?.id === userId) {
      alert(t.userManagement.errors.cannotDeleteSelf);
      return;
    }

    if (deleteUser(userId)) {
      loadUsers();
      setDeleteConfirm(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "analyst":
        return <Users className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    return t.userManagement.roles[role];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t.userManagement.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {t.userManagement.subtitle}
            </CardDescription>
          </div>
          <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t.userManagement.addUser}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            type="text"
            placeholder={isRTL ? "بحث..." : "Search..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(isRTL ? "pr-10" : "pl-10")}
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className={cn("p-3 text-sm font-semibold text-left", isRTL && "text-right")}>
                  {isRTL ? "المستخدم" : "User"}
                </th>
                <th className={cn("p-3 text-sm font-semibold text-left", isRTL && "text-right")}>
                  {t.userManagement.email}
                </th>
                <th className={cn("p-3 text-sm font-semibold text-left", isRTL && "text-right")}>
                  {t.userManagement.role}
                </th>
                <th className={cn("p-3 text-sm font-semibold text-left", isRTL && "text-right")}>
                  {t.userManagement.status}
                </th>
                <th className={cn("p-3 text-sm font-semibold text-left", isRTL && "text-right")}>
                  {t.userManagement.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={cn("p-8 text-center text-muted-foreground", isRTL && "text-right")}>
                    {t.userManagement.noUsers}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-8 w-8 text-muted-foreground" />
                        )}
                        <span className="font-medium">{user.name}</span>
                        {currentUser?.id === user.id && (
                          <span className="text-xs text-muted-foreground">({isRTL ? "أنت" : "You"})</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm">{user.email}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="text-sm">{getRoleLabel(user.role)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          user.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        )}
                      >
                        {user.status === "active" ? t.userManagement.active : t.userManagement.disabled}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(user.id)}
                          disabled={currentUser?.id === user.id}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingUser ? t.userManagement.editUser : t.userManagement.addUser}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label>{t.userManagement.form.uploadImage}</Label>
                <div className="flex items-center gap-4">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-20 h-20 text-muted-foreground" />
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label>{t.userManagement.fullName}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isRTL ? "أدخل الاسم الكامل" : "Enter full name"}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive">{formErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>{t.userManagement.email}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={isRTL ? "example@email.com" : "example@email.com"}
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive">{formErrors.email}</p>
                )}
              </div>

              {/* Password (only for new users) */}
              {!editingUser && (
                <div className="space-y-2">
                  <Label>{t.userManagement.password}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isRTL ? "كلمة المرور" : "Password"}
                  />
                  {formErrors.password && (
                    <p className="text-xs text-destructive">{formErrors.password}</p>
                  )}
                </div>
              )}

              {/* Role */}
              <div className="space-y-2">
                <Label>{t.userManagement.role}</Label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  disabled={editingUser?.id === currentUser?.id && editingUser?.role === "admin"}
                >
                  <option value="admin">{t.userManagement.roles.admin}</option>
                  <option value="analyst">{t.userManagement.roles.analyst}</option>
                  <option value="viewer">{t.userManagement.roles.viewer}</option>
                </Select>
                {formErrors.role && (
                  <p className="text-xs text-destructive">{formErrors.role}</p>
                )}
                {editingUser?.id === currentUser?.id && editingUser?.role === "admin" && (
                  <p className="text-xs text-muted-foreground">
                    {t.userManagement.errors.cannotDemoteSelf}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>{t.userManagement.status}</Label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "disabled" })}
                >
                  <option value="active">{t.userManagement.active}</option>
                  <option value="disabled">{t.userManagement.disabled}</option>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={handleCloseModal}>
                  {t.userManagement.cancel}
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {t.userManagement.save}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">{t.userManagement.deleteUser}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{t.userManagement.confirmDelete}</p>
              <p className="text-sm text-muted-foreground">{t.userManagement.confirmDeleteMessage}</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                  {t.userManagement.cancel}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  {t.userManagement.delete}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}

