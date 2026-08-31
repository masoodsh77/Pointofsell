import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';
import { Supplier } from '../../src/types';

const router = Router();

// GET /api/suppliers (Admin only)
router.get('/', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { search } = req.query;
  const rawData = db.getRawData();
  let suppliers = [...rawData.suppliers];

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    suppliers = suppliers.filter(
      (s) => s.name.toLowerCase().includes(q) || s.phone.includes(q)
    );
  }

  res.json({ success: true, data: suppliers });
});

// POST /api/suppliers
router.post('/', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { name, phone, address, description } = req.body;
  if (!name || !String(name).trim()) {
    res.status(400).json({ success: false, message: 'نام تامین‌کننده الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  const newSupplier: Supplier = {
    id: `sup-${Date.now()}`,
    name: String(name).trim(),
    phone: phone ? String(phone).trim() : '',
    address: address || '',
    description: description || '',
    totalPurchases: 0,
    createdAt: new Date().toISOString(),
  };

  rawData.suppliers.push(newSupplier);
  db.commit();
  res.status(201).json({ success: true, data: newSupplier });
});

// PUT /api/suppliers/:id
router.put('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.suppliers.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'تامین‌کننده یافت نشد.' });
    return;
  }

  const { name, phone, address, description } = req.body;
  rawData.suppliers[index] = {
    ...rawData.suppliers[index],
    name: name !== undefined ? String(name).trim() : rawData.suppliers[index].name,
    phone: phone !== undefined ? String(phone).trim() : rawData.suppliers[index].phone,
    address: address !== undefined ? address : rawData.suppliers[index].address,
    description: description !== undefined ? description : rawData.suppliers[index].description,
  };

  db.commit();
  res.json({ success: true, data: rawData.suppliers[index] });
});

// GET /api/suppliers/:id/purchases (List all purchases from this supplier)
router.get('/:id/purchases', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const supplierId = req.params.id;
  const supplier = rawData.suppliers.find((s) => s.id === supplierId);

  if (!supplier) {
    res.status(404).json({ success: false, message: 'تامین‌کننده یافت نشد.' });
    return;
  }

  const purchases = rawData.purchases
    .filter((p) => p.supplierId === supplierId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: {
      supplier,
      purchases,
      totalPurchasesCount: purchases.length,
      totalPurchasesAmount: purchases.filter((p) => p.status === 'COMPLETED').reduce((acc, p) => acc + p.totalAmount, 0),
    },
  });
});

// DELETE /api/suppliers/:id
router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.suppliers.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'تامین‌کننده یافت نشد.' });
    return;
  }

  // Check if purchases exist for this supplier
  const hasPurchases = rawData.purchases.some((p) => p.supplierId === req.params.id);
  if (hasPurchases) {
    res.status(400).json({
      success: false,
      message: 'نمی‌توانید تامین‌کننده‌ای که برای آن فاکتور خرید ثبت شده است را حذف کنید.',
    });
    return;
  }

  rawData.suppliers.splice(index, 1);
  db.commit();
  res.json({ success: true, message: 'تامین‌کننده با موفقیت حذف شد.' });
});

export default router;
