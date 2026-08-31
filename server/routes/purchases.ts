import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';
import { Purchase, PurchaseItem, StockMovement } from '../../src/types';

const router = Router();

// GET /api/purchases (Admin only)
router.get('/', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { supplierId, startDate, endDate } = req.query;
  const rawData = db.getRawData();

  let purchases = [...rawData.purchases];

  if (supplierId && typeof supplierId === 'string') {
    purchases = purchases.filter((p) => p.supplierId === supplierId);
  }

  if (startDate && typeof startDate === 'string') {
    purchases = purchases.filter((p) => new Date(p.createdAt) >= new Date(startDate));
  }
  if (endDate && typeof endDate === 'string') {
    purchases = purchases.filter((p) => new Date(p.createdAt) <= new Date(endDate));
  }

  res.json({ success: true, data: purchases });
});

// GET /api/purchases/:id
router.get('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const purchase = rawData.purchases.find((p) => p.id === req.params.id);

  if (!purchase) {
    res.status(404).json({ success: false, message: 'فاکتور خرید یافت نشد.' });
    return;
  }

  res.json({ success: true, data: purchase });
});

// POST /api/purchases (Admin only: Register Purchase from Supplier)
router.post('/', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { supplierId, items, description, invoiceDate } = req.body;

  if (!supplierId || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'تامین‌کننده و حداقل یک قلم کالا الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  const supplier = rawData.suppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    res.status(404).json({ success: false, message: 'تامین‌کننده یافت نشد.' });
    return;
  }

  // Validate items
  for (const item of items) {
    if (!item.productId || !item.quantity || Number(item.quantity) <= 0 || item.unitPurchasePrice === undefined) {
      res.status(400).json({ success: false, message: 'اطلاعات اقلام خرید ناقص یا نامعتبر است.' });
      return;
    }
    const product = rawData.products.find((p) => p.id === item.productId);
    if (!product) {
      res.status(404).json({ success: false, message: `محصول با شناسه ${item.productId} یافت نشد.` });
      return;
    }
  }

  const purchaseId = `purch-${Date.now()}`;
  const invoiceNumber = db.getNextPurchaseNumber();
  const createdAt = invoiceDate || new Date().toISOString();

  let totalAmount = 0;
  const purchaseItems: PurchaseItem[] = [];
  const stockMovementsToLog: StockMovement[] = [];

  // Execute purchase transaction
  for (const item of items) {
    const product = rawData.products.find((p) => p.id === item.productId)!;
    const qty = Number(item.quantity);
    const unitPrice = Number(item.unitPurchasePrice);
    const lineTotal = qty * unitPrice;
    totalAmount += lineTotal;

    const previousStock = product.stock;
    const newStock = previousStock + qty;

    // Update product stock and last purchase price
    product.stock = newStock;
    product.purchasePrice = unitPrice;
    product.updatedAt = createdAt;

    purchaseItems.push({
      id: `pi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      purchaseId,
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unit: product.unit,
      unitPurchasePrice: unitPrice,
      total: lineTotal,
    });

    stockMovementsToLog.push({
      id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      type: 'PURCHASE',
      quantity: qty,
      previousStock,
      newStock,
      referenceId: invoiceNumber,
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'مدیر خرید',
      notes: `ورود کالا بر اساس فاکتور خرید ${invoiceNumber} از ${supplier.name}`,
      createdAt,
    });
  }

  // Update supplier total
  supplier.totalPurchases = (supplier.totalPurchases || 0) + totalAmount;

  const newPurchase: Purchase = {
    id: purchaseId,
    invoiceNumber,
    supplierId: supplier.id,
    supplierName: supplier.name,
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'مدیر خرید',
    items: purchaseItems,
    totalAmount,
    status: 'COMPLETED',
    description: description || '',
    createdAt,
  };

  rawData.purchases.unshift(newPurchase);
  rawData.stockMovements.unshift(...stockMovementsToLog);
  db.commit();

  res.status(201).json({
    success: true,
    message: 'فاکتور خرید با موفقیت ثبت و موجودی انبار به‌روزرسانی شد.',
    data: newPurchase,
  });
});

// PUT /api/purchases/:id (Edit purchase invoice and sync stock)
router.put('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.purchases.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'فاکتور خرید یافت نشد.' });
    return;
  }

  const existingPurchase = rawData.purchases[index];
  const { supplierId, items, description, invoiceDate } = req.body;

  if (!supplierId || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'اطلاعات تامین‌کننده و اقلام الزامی است.' });
    return;
  }

  const supplier = rawData.suppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    res.status(404).json({ success: false, message: 'تامین‌کننده یافت نشد.' });
    return;
  }

  // 1. Revert previous stock movements for this purchase
  for (const oldItem of existingPurchase.items) {
    const prod = rawData.products.find((p) => p.id === oldItem.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - Number(oldItem.quantity));
    }
  }

  // Revert previous supplier total
  const oldSupplier = rawData.suppliers.find((s) => s.id === existingPurchase.supplierId);
  if (oldSupplier) {
    oldSupplier.totalPurchases = Math.max(0, (oldSupplier.totalPurchases || 0) - existingPurchase.totalAmount);
  }

  // 2. Apply new items and calculate totals
  let totalAmount = 0;
  const newItems: PurchaseItem[] = [];
  const stockMovementsToLog: StockMovement[] = [];
  const now = invoiceDate || existingPurchase.createdAt;

  for (const item of items) {
    const prod = rawData.products.find((p) => p.id === item.productId);
    if (!prod) continue;

    const qty = Number(item.quantity);
    const unitPrice = Number(item.unitPurchasePrice);
    const lineTotal = qty * unitPrice;
    totalAmount += lineTotal;

    const prevStock = prod.stock;
    prod.stock = prevStock + qty;
    prod.purchasePrice = unitPrice;
    prod.updatedAt = new Date().toISOString();

    newItems.push({
      id: item.id || `pi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      purchaseId: existingPurchase.id,
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unit: prod.unit,
      unitPurchasePrice: unitPrice,
      total: lineTotal,
    });

    stockMovementsToLog.push({
      id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: prod.id,
      productName: prod.name,
      type: 'PURCHASE',
      quantity: qty,
      previousStock: prevStock,
      newStock: prod.stock,
      referenceId: existingPurchase.invoiceNumber,
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'مدیر خرید',
      notes: `اصلاح فاکتور خرید ${existingPurchase.invoiceNumber} از ${supplier.name}`,
      createdAt: now,
    });
  }

  supplier.totalPurchases = (supplier.totalPurchases || 0) + totalAmount;

  const updatedPurchase: Purchase = {
    ...existingPurchase,
    supplierId: supplier.id,
    supplierName: supplier.name,
    items: newItems,
    totalAmount,
    description: description !== undefined ? description : existingPurchase.description,
    createdAt: now,
  };

  rawData.purchases[index] = updatedPurchase;
  rawData.stockMovements.unshift(...stockMovementsToLog);
  db.commit();

  res.json({
    success: true,
    message: 'فاکتور خرید با موفقیت ویرایش و موجودی انبار بازتنظیم شد.',
    data: updatedPurchase,
  });
});

// DELETE /api/purchases/:id (Delete/Cancel purchase and revert inventory)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.purchases.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'فاکتور خرید یافت نشد.' });
    return;
  }

  const purchase = rawData.purchases[index];
  const now = new Date().toISOString();
  const stockMovementsToLog: StockMovement[] = [];

  // Revert stock for each item
  for (const item of purchase.items) {
    const product = rawData.products.find((p) => p.id === item.productId);
    if (product) {
      const prevStock = product.stock;
      const newStock = Math.max(0, prevStock - Number(item.quantity));
      product.stock = newStock;
      product.updatedAt = now;

      stockMovementsToLog.push({
        id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        productName: product.name,
        type: 'RETURN',
        quantity: -Number(item.quantity),
        previousStock: prevStock,
        newStock,
        referenceId: purchase.invoiceNumber,
        userId: req.user?.id || 'admin',
        userName: req.user?.name || 'مدیر خرید',
        notes: `ابطال فاکتور خرید ${purchase.invoiceNumber} و کسر از انبار`,
        createdAt: now,
      });
    }
  }

  // Deduct from supplier total
  const supplier = rawData.suppliers.find((s) => s.id === purchase.supplierId);
  if (supplier) {
    supplier.totalPurchases = Math.max(0, (supplier.totalPurchases || 0) - purchase.totalAmount);
  }

  rawData.purchases.splice(index, 1);
  rawData.stockMovements.unshift(...stockMovementsToLog);
  db.commit();

  res.json({
    success: true,
    message: 'فاکتور خرید با موفقیت حذف و مقادیر مربوطه از موجودی انبار کسر شد.',
  });
});

export default router;

