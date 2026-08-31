import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';
import { Sale, SaleItem, StockMovement } from '../../src/types';

const router = Router();

// Sanitize sale object (hide purchase prices and profit for SELLER role)
function sanitizeSale(sale: Sale, isAdmin: boolean): Partial<Sale> {
  const result: any = { ...sale };
  if (!isAdmin) {
    delete result.totalProfit;
    result.items = sale.items.map((item) => {
      const sanitizedItem: any = { ...item };
      delete sanitizedItem.unitPurchasePrice;
      delete sanitizedItem.profit;
      return sanitizedItem;
    });
  }
  return result;
}

// GET /api/sales (List sales with filters)
router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const isAdmin = req.user?.role === 'ADMIN';
  const { startDate, endDate, status, customerId, search } = req.query;
  const rawData = db.getRawData();

  let sales = [...rawData.sales];

  if (status && typeof status === 'string') {
    sales = sales.filter((s) => s.status === status);
  }

  if (customerId && typeof customerId === 'string') {
    sales = sales.filter((s) => s.customerId === customerId);
  }

  if (startDate && typeof startDate === 'string') {
    sales = sales.filter((s) => new Date(s.createdAt) >= new Date(startDate));
  }
  if (endDate && typeof endDate === 'string') {
    sales = sales.filter((s) => new Date(s.createdAt) <= new Date(endDate));
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    sales = sales.filter(
      (s) =>
        s.invoiceNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.includes(q))
    );
  }

  const sanitized = sales.map((s) => sanitizeSale(s, isAdmin));
  res.json({ success: true, data: sanitized });
});

// GET /api/sales/:id
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const isAdmin = req.user?.role === 'ADMIN';
  const rawData = db.getRawData();
  const sale = rawData.sales.find((s) => s.id === req.params.id);

  if (!sale) {
    res.status(404).json({ success: false, message: 'فاکتور فروش یافت نشد.' });
    return;
  }

  res.json({ success: true, data: sanitizeSale(sale, isAdmin) });
});

// POST /api/sales (POS Checkout - Atomic Sale Transaction)
router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const isAdmin = req.user?.role === 'ADMIN';
  const {
    customerId,
    items,
    discount,
    tax,
    paymentMethod,
    cashPaid,
    cardPaid,
    cardTraceNumber,
    cardRRN,
    cardMaskedPan,
    cardTerminalId,
    createdAt,
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'حداقل یک قلم کالا در سبد خرید الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  const now = createdAt || new Date().toISOString();

  // 1. Validate all items and stock before applying any mutations
  for (const item of items) {
    if (!item.productId || !item.quantity || Number(item.quantity) <= 0) {
      res.status(400).json({ success: false, message: 'اطلاعات کالاهای سبد خرید نامعتبر است.' });
      return;
    }

    const product = rawData.products.find((p) => p.id === item.productId);
    if (!product) {
      res.status(404).json({ success: false, message: `محصول با شناسه ${item.productId} در انبار یافت نشد.` });
      return;
    }

    const requestedQty = Number(item.quantity);
    if (product.stock < requestedQty) {
      res.status(400).json({
        success: false,
        message: `موجودی ناکافی برای "${product.name}". موجودی فعلی: ${product.stock} ${product.unit}`,
      });
      return;
    }
  }

  // 2. Resolve Customer
  let customerName = 'مشتری عمومی (حضوری)';
  let customerPhone = '';
  let customer = null;

  if (customerId) {
    customer = rawData.customers.find((c) => c.id === customerId);
    if (customer) {
      customerName = customer.name;
      customerPhone = customer.phone;
    }
  }

  const saleId = `sale-${Date.now()}`;
  const invoiceNumber = db.getNextInvoiceNumber();

  let subtotal = 0;
  let totalProfit = 0;
  const saleItems: SaleItem[] = [];
  const stockMovementsToLog: StockMovement[] = [];

  // 3. Process each item (snapshot prices & reduce stock)
  for (const item of items) {
    const product = rawData.products.find((p) => p.id === item.productId)!;
    const qty = Number(item.quantity);
    const itemDiscount = Number(item.discount) || 0;
    const unitSalePrice = Number(item.unitSalePrice) || product.salePrice;
    const unitPurchasePrice = product.purchasePrice; // Critical snapshot!

    const lineSubtotal = qty * unitSalePrice;
    const lineTotal = Math.max(0, lineSubtotal - itemDiscount);
    const lineCost = qty * unitPurchasePrice;
    const lineProfit = lineTotal - lineCost;

    subtotal += lineSubtotal;
    totalProfit += lineProfit;

    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock - qty);

    // Update Product Stock
    product.stock = newStock;
    product.updatedAt = now;

    saleItems.push({
      id: `si-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      saleId,
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unit: product.unit,
      unitSalePrice,
      unitPurchasePrice,
      discount: itemDiscount,
      total: lineTotal,
      profit: lineProfit,
    });

    stockMovementsToLog.push({
      id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      type: 'SALE',
      quantity: qty,
      previousStock,
      newStock,
      referenceId: invoiceNumber,
      userId: req.user?.id || 'seller',
      userName: req.user?.name || 'صندوق‌دار',
      notes: `فروش بر اساس فاکتور ${invoiceNumber}`,
      createdAt: now,
    });
  }

  const overallDiscount = Number(discount) || 0;
  const overallTax = Number(tax) || 0;
  const finalAmount = Math.max(0, subtotal - overallDiscount + overallTax);
  totalProfit -= overallDiscount; // adjust profit by invoice discount

  // Payment breakdown
  const method = paymentMethod || 'CASH';
  const cPaid = method === 'CASH' ? finalAmount : method === 'SPLIT' ? Number(cashPaid) || 0 : 0;
  const kPaid = method === 'CARD' ? finalAmount : method === 'SPLIT' ? Number(cardPaid) || 0 : 0;

  const newSale: Sale = {
    id: saleId,
    invoiceNumber,
    sellerId: req.user?.id || 'seller',
    sellerName: req.user?.name || 'صندوق‌دار',
    customerId: customer ? customer.id : undefined,
    customerName,
    customerPhone,
    items: saleItems,
    subtotal,
    discount: overallDiscount,
    tax: overallTax,
    finalAmount,
    paymentMethod: method,
    cashPaid: cPaid,
    cardPaid: kPaid,
    cardTraceNumber: cardTraceNumber ? String(cardTraceNumber) : undefined,
    cardRRN: cardRRN ? String(cardRRN) : undefined,
    cardMaskedPan: cardMaskedPan ? String(cardMaskedPan) : undefined,
    cardTerminalId: cardTerminalId ? String(cardTerminalId) : undefined,
    status: 'COMPLETED',
    createdAt: now,
    totalProfit,
  };

  // Update customer statistics if associated
  if (customer) {
    customer.totalPurchases = (customer.totalPurchases || 0) + 1;
    customer.totalSpent = (customer.totalSpent || 0) + finalAmount;
  }

  rawData.sales.unshift(newSale);
  rawData.stockMovements.unshift(...stockMovementsToLog);
  db.commit();

  res.status(201).json({
    success: true,
    message: 'فروش با موفقیت ثبت شد.',
    data: sanitizeSale(newSale, isAdmin),
  });
});

// POST /api/sales/:id/cancel (Cancel Invoice and restore inventory)
router.post('/:id/cancel', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { reason } = req.body;
  const rawData = db.getRawData();
  const sale = rawData.sales.find((s) => s.id === req.params.id);

  if (!sale) {
    res.status(404).json({ success: false, message: 'فاکتور فروش یافت نشد.' });
    return;
  }

  if (sale.status === 'CANCELLED') {
    res.status(400).json({ success: false, message: 'این فاکتور قبلاً لغو شده است.' });
    return;
  }

  const now = new Date().toISOString();
  const stockMovementsToLog: StockMovement[] = [];

  // Restore inventory for each item in the cancelled sale
  for (const item of sale.items) {
    const product = rawData.products.find((p) => p.id === item.productId);
    if (product) {
      const previousStock = product.stock;
      const newStock = previousStock + item.quantity;
      product.stock = newStock;
      product.updatedAt = now;

      stockMovementsToLog.push({
        id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        productName: product.name,
        type: 'SALE_CANCEL',
        quantity: item.quantity,
        previousStock,
        newStock,
        referenceId: sale.invoiceNumber,
        userId: req.user?.id || 'admin',
        userName: req.user?.name || 'مدیر فروشگاه',
        notes: `لغو فاکتور ${sale.invoiceNumber} - علت: ${reason || 'درخواست مشتری'}`,
        createdAt: now,
      });
    }
  }

  // Adjust customer statistics if needed
  if (sale.customerId) {
    const customer = rawData.customers.find((c) => c.id === sale.customerId);
    if (customer) {
      customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - sale.finalAmount);
    }
  }

  sale.status = 'CANCELLED';
  sale.cancelReason = reason || 'لغو توسط مدیر فروشگاه';
  sale.cancelledAt = now;

  rawData.stockMovements.unshift(...stockMovementsToLog);
  db.commit();

  res.json({
    success: true,
    message: 'فاکتور با موفقیت لغو شد و موجودی کالاها به انبار بازگردانده شد.',
    data: sanitizeSale(sale, true),
  });
});

export default router;
