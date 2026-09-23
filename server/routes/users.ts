import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';
import { ALL_PERMISSIONS } from '../../src/utils/permissions';

const router = Router();

// GET /api/users (Admin only)
router.get('/', authMiddleware, requireRole('ADMIN'), (_req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const safeUsers = rawData.users.map((u) => {
    const roleDef = rawData.roles?.find((r) => r.id === u.role);
    const resolvedPermissions =
      u.role === 'ADMIN'
        ? [...ALL_PERMISSIONS]
        : Array.from(
            new Set([
              ...(roleDef?.permissions || []),
              ...(u.customPermissions || []),
            ])
          );

    return {
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      roleName: roleDef ? roleDef.name : (u.role === 'ADMIN' ? 'مدیر کل' : 'صندوق‌دار'),
      permissions: resolvedPermissions,
      customPermissions: u.customPermissions,
      isActive: u.isActive,
      createdAt: u.createdAt,
    };
  });
  res.json({ success: true, data: safeUsers });
});

// POST /api/users (Admin only: Create new user)
router.post('/', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { username, name, password, role, customPermissions } = req.body;

  if (!username || !password || !name) {
    res.status(400).json({ success: false, message: 'نام، نام کاربری و رمز عبور الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  const normalizedUsername = String(username).trim().toLowerCase();

  if (rawData.users.some((u) => u.username.toLowerCase() === normalizedUsername)) {
    res.status(400).json({ success: false, message: 'این نام کاربری قبلاً ثبت شده است.' });
    return;
  }

  // Validate role exists
  const roleId = role || 'SELLER';
  const roleDef = rawData.roles?.find((r) => r.id === roleId);

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = {
    id: `u-${Date.now()}`,
    username: normalizedUsername,
    name: String(name).trim(),
    role: roleId,
    customPermissions: Array.isArray(customPermissions) ? customPermissions : undefined,
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordHash,
  };

  rawData.users.push(newUser);
  db.commit();

  const resolvedPermissions =
    newUser.role === 'ADMIN'
      ? [...ALL_PERMISSIONS]
      : Array.from(
          new Set([
            ...(roleDef?.permissions || []),
            ...(newUser.customPermissions || []),
          ])
        );

  res.status(201).json({
    success: true,
    data: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      roleName: roleDef ? roleDef.name : (newUser.role === 'ADMIN' ? 'مدیر کل' : 'صندوق‌دار'),
      permissions: resolvedPermissions,
      customPermissions: newUser.customPermissions,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    },
    message: 'کاربر جدید با موفقیت ثبت شد.',
  });
});

// PUT /api/users/:id (Admin only: Update user)
router.put('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.users.findIndex((u) => u.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });
    return;
  }

  const { name, role, customPermissions, isActive, password } = req.body;
  const user = rawData.users[index];

  // Prevent disabling self
  if (user.id === req.user?.id && isActive === false) {
    res.status(400).json({ success: false, message: 'شما نمی‌توانید حساب کاربری خودتان را غیرفعال کنید.' });
    return;
  }

  // Prevent changing master admin role to seller
  if (user.username === 'admin' && role && role !== 'ADMIN') {
    res.status(400).json({ success: false, message: 'نقش مدیر اصلی سیستم قابل تغییر نیست.' });
    return;
  }

  if (name !== undefined) user.name = String(name).trim();
  if (role !== undefined) user.role = role;
  if (customPermissions !== undefined) {
    user.customPermissions = Array.isArray(customPermissions) ? customPermissions : undefined;
  }
  if (isActive !== undefined) user.isActive = Boolean(isActive);
  if (password && String(password).trim().length >= 4) {
    user.passwordHash = bcrypt.hashSync(String(password).trim(), 10);
  }

  db.commit();

  const roleDef = rawData.roles?.find((r) => r.id === user.role);
  const resolvedPermissions =
    user.role === 'ADMIN'
      ? [...ALL_PERMISSIONS]
      : Array.from(
          new Set([
            ...(roleDef?.permissions || []),
            ...(user.customPermissions || []),
          ])
        );

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      roleName: roleDef ? roleDef.name : (user.role === 'ADMIN' ? 'مدیر کل' : 'صندوق‌دار'),
      permissions: resolvedPermissions,
      customPermissions: user.customPermissions,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
    message: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد.',
  });
});

// PUT /api/users/:id/password (Admin only: Reset Password)
router.put('/:id/password', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 4) {
    res.status(400).json({ success: false, message: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' });
    return;
  }

  const rawData = db.getRawData();
  const user = rawData.users.find((u) => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });
    return;
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  db.commit();

  res.json({ success: true, message: 'رمز عبور کاربر با موفقیت تغییر کرد.' });
});

export default router;
