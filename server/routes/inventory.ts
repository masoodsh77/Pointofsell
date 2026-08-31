import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';
import { StockMovement } from '../../src/types';

const router = Router();

// GET /api/inventory (Inventory overview)
router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const isAdmin = req.user?.role === 'ADMIN';
  const rawData = db.getRawData();

  const inventoryList = rawData.products.map((p) => {
    const category = rawData.categories.find((c) => c.id === p.categoryId);
    const lastMovement = rawData.stockMovements.find((sm) => sm.productId === p.id);

    const item: any = {
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      categoryId: p.categoryId,
      categoryName: category ? category.name : '-',
      stock: p.stock,
      minimumStock: p.minimumStock,
      unit: p.unit,
      isWeighted: p.isWeighted,
      isLowStock: p.stock <= p.minimumStock,
      salePrice: p.salePrice,
      lastMovementDate: lastMovement ? lastMovement.createdAt : p.createdAt,
    };

    if (isAdmin) {
      item.purchasePrice = p.purchasePrice;
      item.totalPurchaseValue = p.stock * p.purchasePrice;
      item.totalSaleValue = p.stock * p.salePrice;
    }

    return item;
  });

  const lowStockCount = inventoryList.filter((i) => i.isLowStock).length;

  res.json({
    success: true,
    data: {
      items: inventoryList,
      summary: {
        totalProducts: inventoryList.length,
        lowStockCount,
      },
    },
  });
});

// POST /api/inventory/adjust (Admin only: Manual Stock Adjustment)
router.post('/adjust', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { productId, newStock, notes, type } = req.body;

  if (!productId || newStock === undefined || isNaN(Number(newStock))) {
    res.status(400).json({ success: false, message: 'شناسه محصول و مقدار معتبر موجودی الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  const product = rawData.products.find((p) => p.id === productId);

  if (!product) {
    res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    return;
  }

  const previousStock = product.stock;
  const targetStock = Number(newStock);
  const diff = targetStock - previousStock;

  if (targetStock < 0) {
    res.status(400).json({ success: false, message: 'موجودی انبار نمی‌تواند منفی باشد.' });
    return;
  }

  product.stock = targetStock;
  product.updatedAt = new Date().toISOString();

  const movement: StockMovement = {
    id: `sm-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    type: type || 'ADJUSTMENT',
    quantity: Math.abs(diff),
    previousStock,
    newStock: targetStock,
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'مدیر انبار',
    notes: notes || `اصلاح دستی موجودی از ${previousStock} به ${targetStock}`,
    createdAt: new Date().toISOString(),
  };

  rawData.stockMovements.unshift(movement);
  db.commit();

  res.json({
    success: true,
    message: 'موجودی محصول با موفقیت اصلاح و ثبت شد.',
    data: {
      product,
      movement,
    },
  });
});

// GET /api/inventory/movements (Audit Trail)
router.get('/movements', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { productId, type, limit } = req.query;
  const rawData = db.getRawData();

  let movements = [...rawData.stockMovements];

  if (productId && typeof productId === 'string') {
    movements = movements.filter((m) => m.productId === productId);
  }

  if (type && typeof type === 'string') {
    movements = movements.filter((m) => m.type === type);
  }

  const maxLimit = limit ? Number(limit) : 200;
  const sliced = movements.slice(0, maxLimit);

  res.json({ success: true, data: sliced });
});

export default router;
