import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';
import { Expense, Cheque, ExpenseCategory, ChequeStatus, ChequeType } from '../../src/types';

const router = Router();

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  PACKAGING: 'خرید نایلون و بسته‌بندی',
  SALARY: 'حقوق و دستمزد پرسنل',
  RENT: 'اجاره فروشگاه و انبار',
  UTILITIES: 'قبوض (آب، برق، گاز، تلفن)',
  MAINTENANCE: 'تعمیرات و نگهداری تجهیزات',
  MARKETING: 'تبلیغات و بازاریابی',
  TRANSPORT: 'حمل‌ونقل و پیک',
  TAX_LEGAL: 'مالیات و عوارض',
  CONSUMABLES: 'ملزومات مصرفی و نظافت',
  OTHER: 'سایر هزینه‌های متفرقه',
};

// GET /api/accounting/summary (Admin only)
router.get('/summary', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { startDate, endDate } = req.query;
  const rawData = db.getRawData();

  let sales = rawData.sales.filter((s) => s.status === 'COMPLETED');
  let purchases = rawData.purchases.filter((p) => p.status === 'COMPLETED');
  let expenses = rawData.expenses || [];
  const cheques = rawData.cheques || [];

  if (startDate && typeof startDate === 'string') {
    sales = sales.filter((s) => new Date(s.createdAt) >= new Date(startDate));
    purchases = purchases.filter((p) => new Date(p.createdAt) >= new Date(startDate));
    expenses = expenses.filter((e) => new Date(e.date || e.createdAt) >= new Date(startDate));
  }
  if (endDate && typeof endDate === 'string') {
    sales = sales.filter((s) => new Date(s.createdAt) <= new Date(endDate));
    purchases = purchases.filter((p) => new Date(p.createdAt) <= new Date(endDate));
    expenses = expenses.filter((e) => new Date(e.date || e.createdAt) <= new Date(endDate));
  }

  const totalSales = sales.reduce((acc, s) => acc + s.finalAmount, 0);
  const totalPurchases = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const grossProfit = sales.reduce((acc, s) => acc + (s.totalProfit || 0), 0);
  const netProfit = grossProfit - totalExpenses;

  // Cheque reminders
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const next7Days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

  const pendingReceivables = cheques.filter((c) => c.type === 'RECEIVABLE' && c.status === 'PENDING');
  const pendingPayables = cheques.filter((c) => c.type === 'PAYABLE' && c.status === 'PENDING');

  const dueTodayCheques = cheques.filter((c) => {
    if (c.status !== 'PENDING') return false;
    const dueStr = c.dueDate.split('T')[0];
    return dueStr === todayStr;
  });

  const upcomingCheques = cheques.filter((c) => {
    if (c.status !== 'PENDING') return false;
    const dueDateObj = new Date(c.dueDate);
    return dueDateObj > now && dueDateObj <= next7Days;
  });

  const overdueCheques = cheques.filter((c) => {
    if (c.status !== 'PENDING') return false;
    const dueStr = c.dueDate.split('T')[0];
    return dueStr < todayStr;
  });

  // Expenses grouped by category
  const expensesByCategoryMap: Record<string, { amount: number; count: number }> = {};
  for (const exp of expenses) {
    const cat = exp.category || 'OTHER';
    if (!expensesByCategoryMap[cat]) {
      expensesByCategoryMap[cat] = { amount: 0, count: 0 };
    }
    expensesByCategoryMap[cat].amount += Number(exp.amount);
    expensesByCategoryMap[cat].count += 1;
  }

  const expensesByCategory = Object.entries(expensesByCategoryMap).map(([category, val]) => ({
    category: category as ExpenseCategory,
    label: EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] || category,
    amount: val.amount,
    count: val.count,
  }));

  res.json({
    success: true,
    data: {
      totalSales,
      totalPurchases,
      totalExpenses,
      grossProfit,
      netProfit,
      pendingReceivableCheques: {
        count: pendingReceivables.length,
        totalAmount: pendingReceivables.reduce((acc, c) => acc + Number(c.amount), 0),
      },
      pendingPayableCheques: {
        count: pendingPayables.length,
        totalAmount: pendingPayables.reduce((acc, c) => acc + Number(c.amount), 0),
      },
      dueTodayCheques,
      upcomingCheques,
      overdueCheques,
      expensesByCategory,
    },
  });
});

// ==================== EXPENSES ROUTES ====================

// GET /api/accounting/expenses
router.get('/expenses', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { category, search, startDate, endDate } = req.query;
  const rawData = db.getRawData();
  let expenses = [...(rawData.expenses || [])];

  if (category && typeof category === 'string' && category !== 'ALL') {
    expenses = expenses.filter((e) => e.category === category);
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    expenses = expenses.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.recipient && e.recipient.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.receiptNumber && e.receiptNumber.includes(q))
    );
  }

  if (startDate && typeof startDate === 'string') {
    expenses = expenses.filter((e) => new Date(e.date || e.createdAt) >= new Date(startDate));
  }
  if (endDate && typeof endDate === 'string') {
    expenses = expenses.filter((e) => new Date(e.date || e.createdAt) <= new Date(endDate));
  }

  expenses.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  res.json({
    success: true,
    data: expenses,
    totalAmount: expenses.reduce((acc, e) => acc + Number(e.amount), 0),
  });
});

// POST /api/accounting/expenses
router.post('/expenses', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { title, category, amount, date, paymentMethod, recipient, notes, receiptNumber } = req.body;

  if (!title || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ success: false, message: 'عنوان هزینه و مبلغ معتبر الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  if (!rawData.expenses) {
    rawData.expenses = [];
  }

  const newExpense: Expense = {
    id: `exp-${Date.now()}`,
    title: String(title).trim(),
    category: category || 'OTHER',
    amount: Number(amount),
    date: date || new Date().toISOString(),
    paymentMethod: paymentMethod || 'CASH',
    recipient: recipient ? String(recipient).trim() : '',
    notes: notes || '',
    receiptNumber: receiptNumber || '',
    userId: req.user?.id,
    userName: req.user?.name,
    createdAt: new Date().toISOString(),
  };

  rawData.expenses.unshift(newExpense);
  db.commit();

  res.status(201).json({
    success: true,
    message: 'هزینه با موفقیت ثبت شد.',
    data: newExpense,
  });
});

// PUT /api/accounting/expenses/:id
router.put('/expenses/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = (rawData.expenses || []).findIndex((e) => e.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'هزینه یافت نشد.' });
    return;
  }

  const { title, category, amount, date, paymentMethod, recipient, notes, receiptNumber } = req.body;
  const existing = rawData.expenses[index];

  rawData.expenses[index] = {
    ...existing,
    title: title !== undefined ? String(title).trim() : existing.title,
    category: category !== undefined ? category : existing.category,
    amount: amount !== undefined ? Number(amount) : existing.amount,
    date: date !== undefined ? date : existing.date,
    paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
    recipient: recipient !== undefined ? String(recipient).trim() : existing.recipient,
    notes: notes !== undefined ? notes : existing.notes,
    receiptNumber: receiptNumber !== undefined ? receiptNumber : existing.receiptNumber,
  };

  db.commit();

  res.json({
    success: true,
    message: 'هزینه با موفقیت ویرایش شد.',
    data: rawData.expenses[index],
  });
});

// DELETE /api/accounting/expenses/:id
router.delete('/expenses/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = (rawData.expenses || []).findIndex((e) => e.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'هزینه یافت نشد.' });
    return;
  }

  rawData.expenses.splice(index, 1);
  db.commit();

  res.json({ success: true, message: 'هزینه با موفقیت حذف شد.' });
});

// ==================== CHEQUES ROUTES ====================

// GET /api/accounting/cheques
router.get('/cheques', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { type, status, search, dueFilter } = req.query;
  const rawData = db.getRawData();
  let cheques = [...(rawData.cheques || [])];

  if (type && typeof type === 'string' && type !== 'ALL') {
    cheques = cheques.filter((c) => c.type === type);
  }

  if (status && typeof status === 'string' && status !== 'ALL') {
    cheques = cheques.filter((c) => c.status === status);
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const next7Days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

  if (dueFilter === 'TODAY') {
    cheques = cheques.filter((c) => c.dueDate.split('T')[0] === todayStr);
  } else if (dueFilter === 'UPCOMING') {
    cheques = cheques.filter((c) => {
      const d = new Date(c.dueDate);
      return d >= now && d <= next7Days;
    });
  } else if (dueFilter === 'OVERDUE') {
    cheques = cheques.filter((c) => c.status === 'PENDING' && c.dueDate.split('T')[0] < todayStr);
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    cheques = cheques.filter(
      (c) =>
        c.chequeNumber.includes(q) ||
        (c.sayadNumber && c.sayadNumber.includes(q)) ||
        c.bankName.toLowerCase().includes(q) ||
        c.partyName.toLowerCase().includes(q) ||
        c.accountOwner.toLowerCase().includes(q)
    );
  }

  cheques.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  res.json({
    success: true,
    data: cheques,
  });
});

// POST /api/accounting/cheques
router.post('/cheques', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const {
    type,
    chequeNumber,
    sayadNumber,
    bankName,
    branchName,
    accountOwner,
    amount,
    issueDate,
    dueDate,
    partyId,
    partyName,
    partyPhone,
    notes,
  } = req.body;

  if (!chequeNumber || !bankName || !amount || isNaN(Number(amount)) || !dueDate || !partyName) {
    res.status(400).json({ success: false, message: 'شماره چک، نام بانک، مبلغ، تاریخ سررسید و نام طرف حساب الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  if (!rawData.cheques) {
    rawData.cheques = [];
  }

  const newCheque: Cheque = {
    id: `chk-${Date.now()}`,
    type: (type as ChequeType) || 'RECEIVABLE',
    chequeNumber: String(chequeNumber).trim(),
    sayadNumber: sayadNumber ? String(sayadNumber).trim() : '',
    bankName: String(bankName).trim(),
    branchName: branchName || '',
    accountOwner: accountOwner ? String(accountOwner).trim() : partyName,
    amount: Number(amount),
    issueDate: issueDate || new Date().toISOString(),
    dueDate,
    status: 'PENDING',
    partyId: partyId || undefined,
    partyName: String(partyName).trim(),
    partyPhone: partyPhone || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  rawData.cheques.push(newCheque);
  db.commit();

  res.status(201).json({
    success: true,
    message: 'چک با موفقیت ثبت شد.',
    data: newCheque,
  });
});

// PUT /api/accounting/cheques/:id/status (Fast status update: CLEARED, BOUNCED, PENDING, CANCELLED)
router.put('/cheques/:id/status', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { status, clearedDate } = req.body;
  const rawData = db.getRawData();
  const index = (rawData.cheques || []).findIndex((c) => c.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'چک مورد نظر یافت نشد.' });
    return;
  }

  const chk = rawData.cheques[index];
  chk.status = status as ChequeStatus;
  if (status === 'CLEARED') {
    chk.clearedDate = clearedDate || new Date().toISOString();
  } else if (status === 'PENDING') {
    delete chk.clearedDate;
  }

  db.commit();

  res.json({
    success: true,
    message: `وضعیت چک به «${status === 'CLEARED' ? 'پاس شده' : status === 'BOUNCED' ? 'برگشت خورده' : status === 'CANCELLED' ? 'باطل شده' : 'در انتظار'}» تغییر یافت.`,
    data: chk,
  });
});

// PUT /api/accounting/cheques/:id
router.put('/cheques/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = (rawData.cheques || []).findIndex((c) => c.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'چک مورد نظر یافت نشد.' });
    return;
  }

  const existing = rawData.cheques[index];
  const {
    type,
    chequeNumber,
    sayadNumber,
    bankName,
    branchName,
    accountOwner,
    amount,
    issueDate,
    dueDate,
    status,
    partyId,
    partyName,
    partyPhone,
    notes,
  } = req.body;

  rawData.cheques[index] = {
    ...existing,
    type: type !== undefined ? type : existing.type,
    chequeNumber: chequeNumber !== undefined ? String(chequeNumber).trim() : existing.chequeNumber,
    sayadNumber: sayadNumber !== undefined ? String(sayadNumber).trim() : existing.sayadNumber,
    bankName: bankName !== undefined ? String(bankName).trim() : existing.bankName,
    branchName: branchName !== undefined ? branchName : existing.branchName,
    accountOwner: accountOwner !== undefined ? String(accountOwner).trim() : existing.accountOwner,
    amount: amount !== undefined ? Number(amount) : existing.amount,
    issueDate: issueDate !== undefined ? issueDate : existing.issueDate,
    dueDate: dueDate !== undefined ? dueDate : existing.dueDate,
    status: status !== undefined ? status : existing.status,
    partyId: partyId !== undefined ? partyId : existing.partyId,
    partyName: partyName !== undefined ? String(partyName).trim() : existing.partyName,
    partyPhone: partyPhone !== undefined ? partyPhone : existing.partyPhone,
    notes: notes !== undefined ? notes : existing.notes,
  };

  db.commit();

  res.json({
    success: true,
    message: 'اطلاعات چک با موفقیت به‌روزرسانی شد.',
    data: rawData.cheques[index],
  });
});

// DELETE /api/accounting/cheques/:id
router.delete('/cheques/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = (rawData.cheques || []).findIndex((c) => c.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'چک مورد نظر یافت نشد.' });
    return;
  }

  rawData.cheques.splice(index, 1);
  db.commit();

  res.json({ success: true, message: 'چک با موفقیت حذف شد.' });
});

export default router;
