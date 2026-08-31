import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, AuthRequest } from '../auth';
import { Customer } from '../../src/types';

const router = Router();

// GET /api/customers
router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { search } = req.query;
  const rawData = db.getRawData();
  let customers = [...rawData.customers];

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    customers = customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }

  res.json({ success: true, data: customers });
});

// POST /api/customers
router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { name, phone, address, description, notes, fixedDiscountPercent, fixedDiscountAmount, creditBalance, maxCreditLimit } = req.body;
  if (!name || !String(name).trim()) {
    res.status(400).json({ success: false, message: 'نام مشتری الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    name: String(name).trim(),
    phone: phone ? String(phone).trim() : '',
    address: address || '',
    description: description || '',
    notes: notes || '',
    fixedDiscountPercent: fixedDiscountPercent ? Number(fixedDiscountPercent) : 0,
    fixedDiscountAmount: fixedDiscountAmount ? Number(fixedDiscountAmount) : 0,
    creditBalance: creditBalance ? Number(creditBalance) : 0,
    maxCreditLimit: maxCreditLimit ? Number(maxCreditLimit) : 0,
    totalPurchases: 0,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
  };

  rawData.customers.push(newCustomer);
  db.commit();
  res.status(201).json({ success: true, data: newCustomer });
});

// GET /api/customers/:id/invoices (List all sales invoices for customer)
router.get('/:id/invoices', authMiddleware, (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const customerId = req.params.id;
  const customer = rawData.customers.find((c) => c.id === customerId);

  if (!customer) {
    res.status(404).json({ success: false, message: 'مشتری یافت نشد.' });
    return;
  }

  const sales = rawData.sales
    .filter((s) => s.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: {
      customer,
      invoices: sales,
      totalInvoices: sales.length,
      totalSpent: sales.filter((s) => s.status === 'COMPLETED').reduce((acc, s) => acc + s.finalAmount, 0),
    },
  });
});

// GET /api/customers/:id/transactions (Financial balance & history)
router.get('/:id/transactions', authMiddleware, (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const customerId = req.params.id;
  const customer = rawData.customers.find((c) => c.id === customerId);

  if (!customer) {
    res.status(404).json({ success: false, message: 'مشتری یافت نشد.' });
    return;
  }

  const transactions = (rawData.customerTransactions || [])
    .filter((t) => t.customerId === customerId)
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  res.json({
    success: true,
    data: {
      customer,
      creditBalance: customer.creditBalance || 0,
      transactions,
    },
  });
});

// POST /api/customers/:id/transactions (Add payment or adjust credit/debt)
router.post('/:id/transactions', authMiddleware, (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const customerId = req.params.id;
  const customer = rawData.customers.find((c) => c.id === customerId);

  if (!customer) {
    res.status(404).json({ success: false, message: 'مشتری یافت نشد.' });
    return;
  }

  const { type, amount, description, paymentMethod, referenceId, date } = req.body;
  const numAmount = Number(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ success: false, message: 'مبلغ تراکنش نامعتبر است.' });
    return;
  }

  const now = date || new Date().toISOString();
  const newTx = {
    id: `ctx-${Date.now()}`,
    customerId,
    customerName: customer.name,
    type: type || 'PAYMENT', // 'PAYMENT' (دریافت پول/کاهش بدهی) or 'DEBT_ADD' (افزایش بدهی) or 'REFUND'
    amount: numAmount,
    description: description || (type === 'PAYMENT' ? 'دریافت وجه / تسویه حساب' : 'ثبت بدهی جدید'),
    paymentMethod: paymentMethod || 'CASH',
    referenceId: referenceId || '',
    date: now,
    createdAt: new Date().toISOString(),
  };

  if (!rawData.customerTransactions) {
    rawData.customerTransactions = [];
  }
  rawData.customerTransactions.unshift(newTx);

  // Update customer credit balance:
  // (creditBalance: منفی = بدهکار است، مثبت = بستانکار است / یا اگر به عنوان بدهی در نظر بگیریم:
  // برای سادگی: اگر بدهکار باشد creditBalance منفی است؛ با دریافت پول (PAYMENT) به موجودی اضافه می‌شود).
  const currentBal = customer.creditBalance || 0;
  if (type === 'PAYMENT' || type === 'DEBT_SETTLE') {
    customer.creditBalance = currentBal + numAmount; // کاهش بدهی / افزایش بستانکاری
  } else if (type === 'DEBT_ADD') {
    customer.creditBalance = currentBal - numAmount; // افزایش بدهی
  } else if (type === 'REFUND') {
    customer.creditBalance = currentBal - numAmount;
  }

  db.commit();

  res.status(201).json({
    success: true,
    message: 'تراکنش مالی با موفقیت ثبت شد.',
    data: {
      transaction: newTx,
      updatedBalance: customer.creditBalance,
    },
  });
});

// PUT /api/customers/:id
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.customers.findIndex((c) => c.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'مشتری یافت نشد.' });
    return;
  }

  const { name, phone, address, description, notes, fixedDiscountPercent, fixedDiscountAmount, creditBalance, maxCreditLimit } = req.body;
  rawData.customers[index] = {
    ...rawData.customers[index],
    name: name !== undefined ? String(name).trim() : rawData.customers[index].name,
    phone: phone !== undefined ? String(phone).trim() : rawData.customers[index].phone,
    address: address !== undefined ? address : rawData.customers[index].address,
    description: description !== undefined ? description : rawData.customers[index].description,
    notes: notes !== undefined ? notes : rawData.customers[index].notes,
    fixedDiscountPercent: fixedDiscountPercent !== undefined ? Number(fixedDiscountPercent) : rawData.customers[index].fixedDiscountPercent,
    fixedDiscountAmount: fixedDiscountAmount !== undefined ? Number(fixedDiscountAmount) : rawData.customers[index].fixedDiscountAmount,
    creditBalance: creditBalance !== undefined ? Number(creditBalance) : rawData.customers[index].creditBalance,
    maxCreditLimit: maxCreditLimit !== undefined ? Number(maxCreditLimit) : rawData.customers[index].maxCreditLimit,
  };

  db.commit();
  res.json({ success: true, data: rawData.customers[index] });
});

// DELETE /api/customers/:id
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.customers.findIndex((c) => c.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'مشتری یافت نشد.' });
    return;
  }

  if (rawData.customers[index].id === 'cust-1') {
    res.status(400).json({ success: false, message: 'امکان حذف مشتری عمومی وجود ندارد.' });
    return;
  }

  rawData.customers.splice(index, 1);
  db.commit();
  res.json({ success: true, message: 'مشتری با موفقیت حذف شد.' });
});

export default router;
