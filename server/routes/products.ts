import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';
import { Product } from '../../src/types';

const router = Router();

// Helper to sanitize product for non-admins (hide purchasePrice)
function sanitizeProduct(product: Product, isAdmin: boolean): Partial<Product> {
  const category = db.getRawData().categories.find((c) => c.id === product.categoryId);
  const result: any = {
    ...product,
    categoryName: category ? category.name : 'دسته‌بندی نشده',
  };

  if (!isAdmin) {
    delete result.purchasePrice;
  }
  return result;
}

// GET /api/products (supports query: search, categoryId, lowStock, isWeighted)
router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const isAdmin = req.user?.role === 'ADMIN';
  const { search, categoryId, lowStock } = req.query;
  const rawData = db.getRawData();

  let products = [...rawData.products];

  if (categoryId && typeof categoryId === 'string') {
    products = products.filter((p) => p.categoryId === categoryId);
  }

  if (lowStock === 'true') {
    products = products.filter((p) => p.stock <= p.minimumStock);
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  const sanitized = products.map((p) => sanitizeProduct(p, isAdmin));
  res.json({ success: true, data: sanitized });
});

// GET /api/products/barcode/:barcode (Fast lookup for scanner)
router.get('/barcode/:barcode', authMiddleware, (req: AuthRequest, res: Response): void => {
  const isAdmin = req.user?.role === 'ADMIN';
  const { barcode } = req.params;
  const rawData = db.getRawData();

  const product = rawData.products.find((p) => p.barcode === barcode.trim());
  if (!product) {
    res.status(404).json({ success: false, message: 'محصولی با این بارکد یافت نشد.' });
    return;
  }

  res.json({ success: true, data: sanitizeProduct(product, isAdmin) });
});

// GET /api/products/generate-barcode
router.get('/generate-barcode', authMiddleware, (_req: AuthRequest, res: Response): void => {
  const nextBarcode = db.getNextBarcode();
  res.json({ success: true, data: { barcode: nextBarcode } });
});

// GET /api/products/:id
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const isAdmin = req.user?.role === 'ADMIN';
  const rawData = db.getRawData();
  const product = rawData.products.find((p) => p.id === req.params.id);

  if (!product) {
    res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    return;
  }

  res.json({ success: true, data: sanitizeProduct(product, isAdmin) });
});

// POST /api/products (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const {
    name,
    sku,
    barcode,
    categoryId,
    purchasePrice,
    salePrice,
    stock,
    minimumStock,
    unit,
    isWeighted,
    description,
    image,
  } = req.body;

  if (!name || !salePrice || isNaN(Number(salePrice))) {
    res.status(400).json({ success: false, message: 'نام محصول و قیمت فروش معتبر الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  const finalBarcode = barcode && String(barcode).trim() ? String(barcode).trim() : db.getNextBarcode();

  // Check unique barcode
  if (rawData.products.some((p) => p.barcode === finalBarcode)) {
    res.status(400).json({ success: false, message: 'این بارکد قبلاً برای محصول دیگری ثبت شده است.' });
    return;
  }

  // Check unique SKU if provided
  const finalSku = sku && String(sku).trim() ? String(sku).trim() : `SKU-${Date.now()}`;
  if (rawData.products.some((p) => p.sku === finalSku)) {
    res.status(400).json({ success: false, message: 'این کد کالا (SKU) تکراری است.' });
    return;
  }

  const now = new Date().toISOString();
  const initialStock = Number(stock) || 0;

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: String(name).trim(),
    sku: finalSku,
    barcode: finalBarcode,
    categoryId: categoryId || 'cat-1',
    purchasePrice: Number(purchasePrice) || 0,
    salePrice: Number(salePrice),
    stock: initialStock,
    minimumStock: Number(minimumStock) || 5,
    unit: unit || (isWeighted ? 'KG' : 'PIECE'),
    isWeighted: Boolean(isWeighted),
    description: description || '',
    image: image || '',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  rawData.products.unshift(newProduct);

  // Log Initial Stock Movement if stock > 0
  if (initialStock > 0) {
    rawData.stockMovements.unshift({
      id: `sm-${Date.now()}`,
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'INITIAL_STOCK',
      quantity: initialStock,
      previousStock: 0,
      newStock: initialStock,
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'مدیر',
      notes: 'ثبت محصول جدید با موجودی اولیه',
      createdAt: now,
    });
  }

  db.commit();
  res.status(201).json({ success: true, data: sanitizeProduct(newProduct, true) });
});

// PUT /api/products/:id (Admin only)
router.put('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    return;
  }

  const existing = rawData.products[index];
  const {
    name,
    sku,
    barcode,
    categoryId,
    purchasePrice,
    salePrice,
    minimumStock,
    unit,
    isWeighted,
    description,
    image,
    isActive,
  } = req.body;

  // Check unique barcode if changed
  if (barcode && barcode !== existing.barcode) {
    if (rawData.products.some((p) => p.barcode === barcode && p.id !== existing.id)) {
      res.status(400).json({ success: false, message: 'این بارکد تکراری است.' });
      return;
    }
  }

  // Check unique SKU if changed
  if (sku && sku !== existing.sku) {
    if (rawData.products.some((p) => p.sku === sku && p.id !== existing.id)) {
      res.status(400).json({ success: false, message: 'این کد کالا (SKU) تکراری است.' });
      return;
    }
  }

  const updated: Product = {
    ...existing,
    name: name !== undefined ? String(name).trim() : existing.name,
    sku: sku !== undefined ? String(sku).trim() : existing.sku,
    barcode: barcode !== undefined ? String(barcode).trim() : existing.barcode,
    categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
    purchasePrice: purchasePrice !== undefined ? Number(purchasePrice) : existing.purchasePrice,
    salePrice: salePrice !== undefined ? Number(salePrice) : existing.salePrice,
    minimumStock: minimumStock !== undefined ? Number(minimumStock) : existing.minimumStock,
    unit: unit !== undefined ? unit : existing.unit,
    isWeighted: isWeighted !== undefined ? Boolean(isWeighted) : existing.isWeighted,
    description: description !== undefined ? description : existing.description,
    image: image !== undefined ? image : existing.image,
    isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
    updatedAt: new Date().toISOString(),
  };

  rawData.products[index] = updated;
  db.commit();
  res.json({ success: true, data: sanitizeProduct(updated, true) });
});

// POST /api/products/bulk-update-price (Admin only: Bulk Price Adjustment)
router.post('/bulk-update-price', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const {
    productIds,
    categoryId,
    targetPrice = 'salePrice', // 'salePrice' | 'purchasePrice' | 'both'
    mode = 'PERCENT', // 'PERCENT' | 'AMOUNT'
    operation = 'INCREASE', // 'INCREASE' | 'DECREASE'
    value,
    roundTo = 0,
  } = req.body;

  const numValue = Number(value);
  if (isNaN(numValue) || numValue <= 0) {
    res.status(400).json({ success: false, message: 'مقدار تغییر قیمت باید عددی بزرگتر از صفر باشد.' });
    return;
  }

  const rawData = db.getRawData();
  let targets = rawData.products;

  // Filter by category if specified
  if (categoryId && categoryId !== 'ALL') {
    targets = targets.filter((p) => p.categoryId === categoryId);
  }

  // Filter by specific product IDs if not 'ALL'
  if (Array.isArray(productIds) && productIds.length > 0 && productIds[0] !== 'ALL') {
    const idSet = new Set(productIds);
    targets = targets.filter((p) => idSet.has(p.id));
  }

  if (targets.length === 0) {
    res.status(400).json({ success: false, message: 'هیچ محصولی برای تغییر قیمت انتخاب نشده است.' });
    return;
  }

  const applyRound = (price: number): number => {
    if (!roundTo || roundTo <= 1) return Math.round(price);
    return Math.round(price / roundTo) * roundTo;
  };

  const calculateNewPrice = (currentPrice: number): number => {
    let delta = 0;
    if (mode === 'PERCENT') {
      delta = (currentPrice * numValue) / 100;
    } else {
      delta = numValue;
    }

    let nextPrice = operation === 'INCREASE' ? currentPrice + delta : currentPrice - delta;
    nextPrice = Math.max(0, applyRound(nextPrice));
    return nextPrice;
  };

  const now = new Date().toISOString();
  let updatedCount = 0;

  for (const product of targets) {
    let changed = false;

    if (targetPrice === 'salePrice' || targetPrice === 'both') {
      const newSalePrice = calculateNewPrice(product.salePrice);
      if (newSalePrice !== product.salePrice) {
        product.salePrice = newSalePrice;
        changed = true;
      }
    }

    if (targetPrice === 'purchasePrice' || targetPrice === 'both') {
      const newPurchasePrice = calculateNewPrice(product.purchasePrice);
      if (newPurchasePrice !== product.purchasePrice) {
        product.purchasePrice = newPurchasePrice;
        changed = true;
      }
    }

    if (changed) {
      product.updatedAt = now;
      updatedCount++;
    }
  }

  db.commit();

  res.json({
    success: true,
    message: `قیمت ${updatedCount} محصول با موفقیت به‌روزرسانی شد.`,
    updatedCount,
  });
});

// DELETE /api/products/:id (Admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    return;
  }

  rawData.products.splice(index, 1);
  db.commit();
  res.json({ success: true, message: 'محصول با موفقیت حذف شد.' });
});

export default router;
