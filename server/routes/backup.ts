import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';

const router = Router();
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// GET /api/backup (Admin only)
router.get('/', authMiddleware, requireRole('ADMIN'), (_req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  res.json({ success: true, data: rawData.backups });
});

// POST /api/backup/create (Admin only: Manual Backup)
router.post('/create', authMiddleware, requireRole('ADMIN'), (_req: AuthRequest, res: Response): void => {
  try {
    const backupItem = db.createBackup(true);
    res.status(201).json({
      success: true,
      message: 'نسخه پشتیبان با موفقیت تهیه و ذخیره شد.',
      data: backupItem,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: `خطا در ایجاد پشتیبان: ${e.message}` });
  }
});

// POST /api/backup/restore (Admin only: Restore Backup)
router.post('/restore', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { filename } = req.body;
  if (!filename) {
    res.status(400).json({ success: false, message: 'نام فایل پشتیبان الزامی است.' });
    return;
  }

  try {
    db.restoreBackup(filename);
    res.json({
      success: true,
      message: 'بازیابی اطلاعات با موفقیت انجام شد (یک نسخه پشتیبان اضطراری از وضعیت قبل نیز ثبت گردید).',
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: `خطا در بازیابی پشتیبان: ${e.message}` });
  }
});

// GET /api/backup/download/:filename
router.get('/download/:filename', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, message: 'فایل پشتیبان یافت نشد.' });
    return;
  }

  res.download(filePath, filename);
});

export default router;
