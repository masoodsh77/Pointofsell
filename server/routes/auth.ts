import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, authMiddleware, AuthRequest } from '../auth';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ success: false, message: 'نام کاربری و رمز عبور الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  const user = rawData.users.find((u) => u.username.toLowerCase() === String(username).trim().toLowerCase());

  if (!user) {
    res.status(401).json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است.' });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ success: false, message: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر تماس بگیرید.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است.' });
    return;
  }

  const safeUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  const token = generateToken(safeUser);
  res.json({
    success: true,
    data: {
      user: safeUser,
      token,
    },
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  res.json({
    success: true,
    data: req.user,
  });
});

export default router;
