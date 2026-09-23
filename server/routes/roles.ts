import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';
import { RoleDefinition, Permission } from '../../src/types';
import { ALL_PERMISSIONS } from '../../src/utils/permissions';

const router = Router();

// GET /api/roles (Get all roles with user count)
router.get('/', authMiddleware, (_req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const roles = rawData.roles || [];
  const users = rawData.users || [];

  const rolesWithCount = roles.map((r) => ({
    ...r,
    userCount: users.filter((u) => u.role === r.id).length,
  }));

  res.json({ success: true, data: rolesWithCount });
});

// POST /api/roles (Admin only: Create new custom role)
router.post('/', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { name, description, color, permissions } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ success: false, message: 'نام نقش الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  if (!rawData.roles) rawData.roles = [];

  const trimmedName = name.trim();
  if (rawData.roles.some((r) => r.name.toLowerCase() === trimmedName.toLowerCase())) {
    res.status(400).json({ success: false, message: 'نقشی با این عنوان قبلاً تعریف شده است.' });
    return;
  }

  const validPermissions: Permission[] = Array.isArray(permissions)
    ? permissions.filter((p) => ALL_PERMISSIONS.includes(p))
    : [];

  const now = new Date().toISOString();
  const newRole: RoleDefinition = {
    id: `role-${Date.now()}`,
    name: trimmedName,
    description: description ? String(description).trim() : '',
    isSystem: false,
    color: color || 'amber',
    permissions: validPermissions,
    createdAt: now,
    updatedAt: now,
  };

  rawData.roles.push(newRole);
  db.commit();

  res.status(201).json({
    success: true,
    data: {
      ...newRole,
      userCount: 0,
    },
    message: 'نقش جدید با موفقیت ایجاد شد.',
  });
});

// PUT /api/roles/:id (Admin only: Update custom role)
router.put('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { name, description, color, permissions } = req.body;
  const rawData = db.getRawData();
  if (!rawData.roles) rawData.roles = [];

  const role = rawData.roles.find((r) => r.id === req.params.id);
  if (!role) {
    res.status(404).json({ success: false, message: 'نقش مورد نظر یافت نشد.' });
    return;
  }

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
      res.status(400).json({ success: false, message: 'نام نقش نمی‌تواند خالی باشد.' });
      return;
    }
    // Check duplicate name on other roles
    if (rawData.roles.some((r) => r.id !== role.id && r.name.toLowerCase() === trimmedName.toLowerCase())) {
      res.status(400).json({ success: false, message: 'نقش دیگری با این نام وجود دارد.' });
      return;
    }
    role.name = trimmedName;
  }

  if (description !== undefined) {
    role.description = String(description).trim();
  }

  if (color !== undefined) {
    role.color = color;
  }

  // System ADMIN role always keeps full permissions
  if (role.id === 'ADMIN') {
    role.permissions = [...ALL_PERMISSIONS];
  } else if (permissions !== undefined && Array.isArray(permissions)) {
    role.permissions = permissions.filter((p) => ALL_PERMISSIONS.includes(p));
  }

  role.updatedAt = new Date().toISOString();
  db.commit();

  const userCount = rawData.users.filter((u) => u.role === role.id).length;

  res.json({
    success: true,
    data: {
      ...role,
      userCount,
    },
    message: 'اطلاعات نقش با موفقیت به‌روزرسانی شد.',
  });
});

// DELETE /api/roles/:id (Admin only: Delete role)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  if (!rawData.roles) rawData.roles = [];

  const index = rawData.roles.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ success: false, message: 'نقش یافت نشد.' });
    return;
  }

  const role = rawData.roles[index];
  if (role.isSystem || role.id === 'ADMIN' || role.id === 'SELLER') {
    res.status(400).json({ success: false, message: 'نقش‌های اصلی و سیستمی قابل حذف نیستند.' });
    return;
  }

  // Check if any users are currently assigned to this role
  const assignedUsers = rawData.users.filter((u) => u.role === role.id);
  if (assignedUsers.length > 0) {
    res.status(400).json({
      success: false,
      message: `این نقش به ${assignedUsers.length} کاربر اختصاص دارد. ابتدا نقش آن‌ها را تغییر دهید.`,
    });
    return;
  }

  rawData.roles.splice(index, 1);
  db.commit();

  res.json({ success: true, message: 'نقش با موفقیت حذف شد.' });
});

export default router;
