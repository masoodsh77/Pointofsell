import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';
import { DashboardStats, ProductUnit } from '../../src/types';

const router = Router();

// Helper to filter dates
function isWithinDays(dateStr: string, days: number): boolean {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff <= days * 24 * 3600 * 1000 && diff >= 0;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// GET /api/reports/dashboard
router.get('/dashboard', authMiddleware, (req: AuthRequest, res: Response): void => {
  const isAdmin = req.user?.role === 'ADMIN';
  const rawData = db.getRawData();
  const completedSales = rawData.sales.filter((s) => s.status === 'COMPLETED');
  const now = new Date();

  // 1. Today calculations
  const todaySales = completedSales.filter((s) => isSameDay(new Date(s.createdAt), now));
  const todaySalesAmount = todaySales.reduce((acc, s) => acc + s.finalAmount, 0);
  const todaySalesCount = todaySales.length;
  const todayProfit = isAdmin ? todaySales.reduce((acc, s) => acc + (s.totalProfit || 0), 0) : 0;
  const todayAverageInvoice = todaySalesCount > 0 ? Math.round(todaySalesAmount / todaySalesCount) : 0;

  // 2. Week calculations (last 7 days)
  const weekSales = completedSales.filter((s) => isWithinDays(s.createdAt, 7));
  const weekSalesAmount = weekSales.reduce((acc, s) => acc + s.finalAmount, 0);
  const weekProfit = isAdmin ? weekSales.reduce((acc, s) => acc + (s.totalProfit || 0), 0) : 0;

  // 3. Month calculations (last 30 days)
  const monthSales = completedSales.filter((s) => isWithinDays(s.createdAt, 30));
  const monthSalesAmount = monthSales.reduce((acc, s) => acc + s.finalAmount, 0);
  const monthProfit = isAdmin ? monthSales.reduce((acc, s) => acc + (s.totalProfit || 0), 0) : 0;

  // 4. Year calculations (last 365 days)
  const yearSales = completedSales.filter((s) => isWithinDays(s.createdAt, 365));
  const yearSalesAmount = yearSales.reduce((acc, s) => acc + s.finalAmount, 0);
  const yearProfit = isAdmin ? yearSales.reduce((acc, s) => acc + (s.totalProfit || 0), 0) : 0;

  // 5. Products stats
  const totalProductsCount = rawData.products.length;
  const lowStockProductsCount = rawData.products.filter((p) => p.stock <= p.minimumStock).length;

  // 6. Top Selling Products Aggregation
  const productSalesMap = new Map<string, { quantity: number; revenue: number; profit: number; unit: ProductUnit; name: string }>();

  for (const sale of completedSales) {
    for (const item of sale.items) {
      const existing = productSalesMap.get(item.productId) || {
        quantity: 0,
        revenue: 0,
        profit: 0,
        unit: item.unit,
        name: item.productName,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.total;
      existing.profit += item.profit || 0;
      productSalesMap.set(item.productId, existing);
    }
  }

  const topSellingProducts = Array.from(productSalesMap.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      totalQuantity: Math.round(data.quantity * 1000) / 1000,
      unit: data.unit,
      totalRevenue: data.revenue,
      totalProfit: isAdmin ? data.profit : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  const worstSellingProducts = rawData.products
    .filter((p) => !productSalesMap.has(p.id))
    .slice(0, 5)
    .map((p) => ({
      productId: p.id,
      productName: p.name,
      stock: p.stock,
      unit: p.unit,
    }));

  // 7. Last 7 Days Chart Data
  const salesChartData: { date: string; sales: number; profit: number; invoices: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(Date.now() - i * 24 * 3600 * 1000);
    const daySales = completedSales.filter((s) => isSameDay(new Date(s.createdAt), targetDate));
    const daySalesAmount = daySales.reduce((acc, s) => acc + s.finalAmount, 0);
    const dayProfit = isAdmin ? daySales.reduce((acc, s) => acc + (s.totalProfit || 0), 0) : 0;

    const dateKey = targetDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
    salesChartData.push({
      date: dateKey,
      sales: daySalesAmount,
      profit: dayProfit,
      invoices: daySales.length,
    });
  }

  // 8. Category Sales Distribution
  const categorySalesMap = new Map<string, number>();
  for (const sale of completedSales) {
    for (const item of sale.items) {
      const prod = rawData.products.find((p) => p.id === item.productId);
      const cat = prod ? rawData.categories.find((c) => c.id === prod.categoryId) : null;
      const catName = cat ? cat.name : 'سایر';
      categorySalesMap.set(catName, (categorySalesMap.get(catName) || 0) + item.total);
    }
  }

  const categorySalesData = Array.from(categorySalesMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const lowStockProducts = rawData.products.filter((p) => p.stock <= p.minimumStock);
  const timeline = salesChartData.map((d) => ({
    date: d.date,
    revenue: d.sales,
    profit: d.profit,
    count: d.invoices,
  }));

  const stats: DashboardStats = {
    todaySalesAmount,
    todaySalesCount,
    todayProfit,
    todayAverageInvoice,
    weekSalesAmount,
    weekProfit,
    monthSalesAmount,
    monthProfit,
    yearSalesAmount,
    yearProfit,
    totalProductsCount,
    lowStockProductsCount,
    topSellingProducts,
    worstSellingProducts,
    recentSales: completedSales.slice(0, 5),
    recentPurchases: isAdmin ? rawData.purchases.slice(0, 5) : [],
    salesChartData,
    categorySalesData,
  };

  res.json({
    success: true,
    data: {
      ...stats,
      today: {
        sales: todaySalesAmount,
        invoicesCount: todaySalesCount,
        profit: todayProfit,
      },
      week: {
        sales: weekSalesAmount,
        invoicesCount: weekSales.length,
        profit: weekProfit,
      },
      month: {
        sales: monthSalesAmount,
        invoicesCount: monthSales.length,
        profit: monthProfit,
      },
      lowStockProducts,
      recentSales: completedSales.slice(0, 5),
      timeline,
    },
  });
});

// GET /api/reports/summary (Period summary for ReportsView)
router.get('/summary', authMiddleware, (req: AuthRequest, res: Response): void => {
  const isAdmin = req.user?.role === 'ADMIN';
  const { period = '30DAYS' } = req.query;
  const rawData = db.getRawData();
  const completedSales = rawData.sales.filter((s) => s.status === 'COMPLETED');
  const now = new Date();

  let filteredSales = completedSales;
  let daysCount = 30;

  if (period === 'TODAY') {
    filteredSales = completedSales.filter((s) => isSameDay(new Date(s.createdAt), now));
    daysCount = 1;
  } else if (period === 'YESTERDAY') {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    filteredSales = completedSales.filter((s) => isSameDay(new Date(s.createdAt), yesterday));
    daysCount = 1;
  } else if (period === '7DAYS') {
    filteredSales = completedSales.filter((s) => isWithinDays(s.createdAt, 7));
    daysCount = 7;
  } else if (period === '30DAYS') {
    filteredSales = completedSales.filter((s) => isWithinDays(s.createdAt, 30));
    daysCount = 30;
  } else if (period === 'YEAR') {
    filteredSales = completedSales.filter((s) => isWithinDays(s.createdAt, 365));
    daysCount = 365;
  }

  const totalSales = filteredSales.reduce((acc, s) => acc + s.finalAmount, 0);
  const totalProfit = isAdmin ? filteredSales.reduce((acc, s) => acc + (s.totalProfit || 0), 0) : 0;
  const invoiceCount = filteredSales.length;
  const averageInvoice = invoiceCount > 0 ? Math.round(totalSales / invoiceCount) : 0;
  const totalDiscount = filteredSales.reduce((acc, s) => acc + s.discount, 0);

  // Timeline chart data
  const chartDays = daysCount === 1 ? 1 : Math.min(daysCount, 30);
  const timeline: { date: string; revenue: number; profit: number; count: number }[] = [];

  if (daysCount === 1) {
    timeline.push({
      date: period === 'YESTERDAY' ? 'دیروز' : 'امروز',
      revenue: totalSales,
      profit: totalProfit,
      count: invoiceCount,
    });
  } else {
    for (let i = chartDays - 1; i >= 0; i--) {
      const targetDate = new Date(Date.now() - i * 24 * 3600 * 1000);
      const daySales = filteredSales.filter((s) => isSameDay(new Date(s.createdAt), targetDate));
      const dayRev = daySales.reduce((acc, s) => acc + s.finalAmount, 0);
      const dayProf = isAdmin ? daySales.reduce((acc, s) => acc + (s.totalProfit || 0), 0) : 0;
      const dateKey = targetDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      timeline.push({
        date: dateKey,
        revenue: dayRev,
        profit: dayProf,
        count: daySales.length,
      });
    }
  }

  // Category sales
  const categorySalesMap = new Map<string, number>();
  for (const sale of filteredSales) {
    for (const item of sale.items) {
      const prod = rawData.products.find((p) => p.id === item.productId);
      const cat = prod ? rawData.categories.find((c) => c.id === prod.categoryId) : null;
      const catName = cat ? cat.name : 'سایر';
      categorySalesMap.set(catName, (categorySalesMap.get(catName) || 0) + item.total);
    }
  }
  const categorySales = Array.from(categorySalesMap.entries()).map(([categoryName, revenue]) => ({
    categoryName,
    revenue,
  }));

  // Top products
  const productSalesMap = new Map<string, { name: string; revenue: number; quantity: number }>();
  for (const sale of filteredSales) {
    for (const item of sale.items) {
      const existing = productSalesMap.get(item.productId) || { name: item.productName, revenue: 0, quantity: 0 };
      existing.revenue += item.total;
      existing.quantity += item.quantity;
      productSalesMap.set(item.productId, existing);
    }
  }
  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({
      productName: p.name,
      totalRevenue: p.revenue,
      totalQuantity: p.quantity,
    }));

  res.json({
    success: true,
    data: {
      totalSales,
      totalProfit,
      invoiceCount,
      averageInvoice,
      totalDiscount,
      timeline,
      categorySales,
      topProducts,
    },
  });
});

// GET /api/reports/sales (Custom date range sales reporting)
router.get('/sales', authMiddleware, (req: AuthRequest, res: Response): void => {
  const isAdmin = req.user?.role === 'ADMIN';
  const { startDate, endDate } = req.query;
  const rawData = db.getRawData();

  let sales = rawData.sales.filter((s) => s.status === 'COMPLETED');

  if (startDate && typeof startDate === 'string') {
    sales = sales.filter((s) => new Date(s.createdAt) >= new Date(startDate));
  }
  if (endDate && typeof endDate === 'string') {
    sales = sales.filter((s) => new Date(s.createdAt) <= new Date(endDate));
  }

  const totalInvoices = sales.length;
  const totalGross = sales.reduce((acc, s) => acc + s.subtotal, 0);
  const totalDiscounts = sales.reduce((acc, s) => acc + s.discount, 0);
  const totalNetSales = sales.reduce((acc, s) => acc + s.finalAmount, 0);
  const totalProfit = isAdmin ? sales.reduce((acc, s) => acc + (s.totalProfit || 0), 0) : 0;
  const cashPayments = sales.reduce((acc, s) => acc + s.cashPaid, 0);
  const cardPayments = sales.reduce((acc, s) => acc + s.cardPaid, 0);

  // Group by day for chart
  const dailyMap = new Map<string, { date: string; sales: number; profit: number; count: number }>();
  for (const s of sales) {
    const d = s.createdAt.split('T')[0];
    const existing = dailyMap.get(d) || { date: d, sales: 0, profit: 0, count: 0 };
    existing.sales += s.finalAmount;
    existing.profit += s.totalProfit || 0;
    existing.count += 1;
    dailyMap.set(d, existing);
  }

  const dailyChart = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    success: true,
    data: {
      summary: {
        totalInvoices,
        totalGross,
        totalDiscounts,
        totalNetSales,
        totalProfit,
        cashPayments,
        cardPayments,
      },
      dailyChart,
      salesList: sales.slice(0, 100),
    },
  });
});

// GET /api/reports/profit (Admin only)
router.get('/profit', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { startDate, endDate } = req.query;
  const rawData = db.getRawData();

  let sales = rawData.sales.filter((s) => s.status === 'COMPLETED');

  if (startDate && typeof startDate === 'string') {
    sales = sales.filter((s) => new Date(s.createdAt) >= new Date(startDate));
  }
  if (endDate && typeof endDate === 'string') {
    sales = sales.filter((s) => new Date(s.createdAt) <= new Date(endDate));
  }

  let totalRevenue = 0;
  let totalCost = 0;
  let totalDiscounts = 0;

  const productProfitMap = new Map<string, { name: string; quantity: number; revenue: number; cost: number; profit: number; unit: ProductUnit }>();

  for (const sale of sales) {
    totalRevenue += sale.subtotal;
    totalDiscounts += sale.discount;

    for (const item of sale.items) {
      const cost = item.quantity * item.unitPurchasePrice;
      totalCost += cost;

      const existing = productProfitMap.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        unit: item.unit,
      };

      existing.quantity += item.quantity;
      existing.revenue += item.total;
      existing.cost += cost;
      existing.profit += (item.total - cost);
      productProfitMap.set(item.productId, existing);
    }
  }

  const netRevenue = totalRevenue - totalDiscounts;
  const netProfit = netRevenue - totalCost;
  const profitMarginPercent = netRevenue > 0 ? Math.round((netProfit / netRevenue) * 1000) / 10 : 0;

  const productProfitList = Array.from(productProfitMap.values())
    .sort((a, b) => b.profit - a.profit);

  res.json({
    success: true,
    data: {
      totalRevenue: netRevenue,
      totalCost,
      totalDiscounts,
      netProfit,
      profitMarginPercent,
      productBreakdown: productProfitList,
    },
  });
});

export default router;
