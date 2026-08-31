import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { Role, User, Permission } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'nuts_pos_store_secure_jwt_secret_key_2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: Role };
    const rawData = db.getRawData();
    const foundUser = rawData.users.find((u) => u.id === decoded.id && u.isActive);

    if (!foundUser) {
      res.status(401).json({ success: false, message: 'حساب کاربری یافت نشد یا غیرفعال شده است.' });
      return;
    }

    req.user = {
      id: foundUser.id,
      username: foundUser.username,
      name: foundUser.name,
      role: foundUser.role,
      isActive: foundUser.isActive,
      createdAt: foundUser.createdAt,
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'توکن نامعتبر یا منقضی شده است.' });
  }
}

export function requireRole(roles: Role | Role[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'احراز هویت الزامی است.' });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'شما دسترسی لازم برای این عملیات را ندارید.' });
      return;
    }
    next();
  };
}
