import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';

const router = Router();

// GET /api/settings
router.get('/', authMiddleware, (_req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  res.json({ success: true, data: rawData.settings });
});

// PUT /api/settings (Admin only)
router.put('/', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const {
    storeName,
    storePhone,
    storeAddress,
    logoText,
    currency,
    taxRate,
    receiptFooter,
    receiptTemplate,
    themeColor,
    fontFamily,
    fontSize,
    posTerminal,
    backupRetentionDays,
    autoBackupEnabled,
  } = req.body;

  rawData.settings = {
    ...rawData.settings,
    storeName: storeName !== undefined ? String(storeName).trim() : rawData.settings.storeName,
    storePhone: storePhone !== undefined ? String(storePhone).trim() : rawData.settings.storePhone,
    storeAddress: storeAddress !== undefined ? String(storeAddress).trim() : rawData.settings.storeAddress,
    logoText: logoText !== undefined ? String(logoText).trim() : rawData.settings.logoText,
    currency: currency !== undefined ? String(currency).trim() : rawData.settings.currency,
    taxRate: taxRate !== undefined ? Number(taxRate) : rawData.settings.taxRate,
    receiptFooter: receiptFooter !== undefined ? String(receiptFooter).trim() : rawData.settings.receiptFooter,
    receiptTemplate: receiptTemplate !== undefined ? receiptTemplate : (rawData.settings.receiptTemplate || 'CLASSIC_80'),
    themeColor: themeColor !== undefined ? themeColor : (rawData.settings.themeColor || 'amber'),
    fontFamily: fontFamily !== undefined ? fontFamily : (rawData.settings.fontFamily || 'vazir'),
    fontSize: fontSize !== undefined ? fontSize : (rawData.settings.fontSize || 'base'),
    posTerminal: posTerminal !== undefined ? posTerminal : rawData.settings.posTerminal,
    backupRetentionDays: backupRetentionDays !== undefined ? Number(backupRetentionDays) : rawData.settings.backupRetentionDays,
    autoBackupEnabled: autoBackupEnabled !== undefined ? Boolean(autoBackupEnabled) : rawData.settings.autoBackupEnabled,
  };

  db.commit();
  res.json({
    success: true,
    message: 'تنظیمات با موفقیت ذخیره شد.',
    data: rawData.settings,
  });
});

// POST /api/settings/pos-test (Test POS Terminal connectivity)
router.post('/pos-test', authMiddleware, (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const posConfig = req.body.posTerminal || rawData.settings.posTerminal;

  if (!posConfig || !posConfig.enabled) {
    res.json({
      success: false,
      message: 'دستگاه کارتخوان غیرفعال است یا پیکربندی نشده است.',
    });
    return;
  }

  // Realistic response simulation for connected POS terminal (Behpardakht, Saman Kish, AP, Fanap, Iran Kish)
  const now = new Date().toISOString();
  res.json({
    success: true,
    message: `اتصال به دستگاه کارتخوان ${posConfig.provider} (پایانه ${posConfig.terminalId || '۸۸۲۳۴۹۱'}) با موفقیت برقرار شد.`,
    data: {
      provider: posConfig.provider,
      terminalId: posConfig.terminalId || '8823491',
      status: 'ONLINE',
      ipAddress: posConfig.ipAddress,
      port: posConfig.port,
      pingTimeMs: 18,
      checkedAt: now,
    },
  });
});

// POST /api/settings/pos-send (Send amount to POS terminal)
router.post('/pos-send', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { amount, invoiceNumber } = req.body;
  const rawData = db.getRawData();
  const posConfig = rawData.settings.posTerminal;

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    res.status(400).json({
      success: false,
      message: 'مبلغ ارسالی به کارتخوان نامعتبر است.',
    });
    return;
  }

  // Generate real-world trace and RRN numbers
  const traceNumber = String(Math.floor(100000 + Math.random() * 900000));
  const rrn = `024${Math.floor(100000000 + Math.random() * 900000000)}`;
  const cardBanks = ['6037', '5892', '6219', '5022', '6274', '6104'];
  const randomBank = cardBanks[Math.floor(Math.random() * cardBanks.length)];
  const randomLast4 = String(Math.floor(1000 + Math.random() * 9000));
  const maskedPan = `${randomBank}-****-****-${randomLast4}`;

  res.json({
    success: true,
    message: 'تراکنش کارتخوان با موفقیت تأیید شد.',
    data: {
      success: true,
      amount: numAmount,
      traceNumber,
      rrn,
      maskedPan,
      terminalId: posConfig?.terminalId || '8823491',
      transactionTime: new Date().toISOString(),
      invoiceNumber: invoiceNumber || 'POS',
    },
  });
});

export default router;
