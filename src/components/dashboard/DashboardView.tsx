import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { formatCurrency, formatPersianDate, formatWeightOrQuantity, toPersianDigits } from '../../utils/persian';
import { TabType } from '../layout/Sidebar';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Barcode,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Users,
  Boxes,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardViewProps {
  onNavigate: (tab: TabType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadDashboard = async () => {
    setLoading(true);
    const res = await apiRequest('/reports/dashboard');
    if (res.success && res.data) {
      setDashboardData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading || !dashboardData) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">در حال بارگذاری اطلاعات داشبورد...</div>
    );
  }

  const today = dashboardData.today || {
    sales: dashboardData.todaySalesAmount || 0,
    invoicesCount: dashboardData.todaySalesCount || 0,
    profit: dashboardData.todayProfit || 0,
  };
  const week = dashboardData.week || {
    sales: dashboardData.weekSalesAmount || 0,
    invoicesCount: 0,
    profit: dashboardData.weekProfit || 0,
  };
  const month = dashboardData.month || {
    sales: dashboardData.monthSalesAmount || 0,
    invoicesCount: 0,
    profit: dashboardData.monthProfit || 0,
  };
  const lowStockProducts = dashboardData.lowStockProducts || [];
  const recentSales = dashboardData.recentSales || [];
  const timeline = dashboardData.timeline || (dashboardData.salesChartData || []).map((d: any) => ({
    date: d.date,
    revenue: d.sales,
    profit: d.profit,
    count: d.invoices,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-[#141414] via-[#1c1c1c] to-[#141414] border border-white/5 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>کنترل پنل مرکزی مدیریت فروشگاه</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            داشبورد وضعیت آجیل و خشکبار برادران جهانتیغ
          </h2>
          <p className="text-xs text-slate-400">
            خلاصه آمار بلادرنگ صندوق، انبار و عملکرد مالی فروشگاه
          </p>
        </div>

        {/* Quick Access Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('pos')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>صندوق فروش (POS)</span>
          </button>
          <button
            onClick={() => onNavigate('purchases')}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl text-xs flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>ثبت خرید جدید</span>
          </button>
          <button
            onClick={() => onNavigate('barcode')}
            className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl text-xs flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
          >
            <Barcode className="w-4 h-4" />
            <span>چاپ بارکد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">فروش امروز</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white font-sans">
            {formatCurrency(today.sales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>{toPersianDigits(today.invoicesCount)} فاکتور صادر شده</span>
            <span className="text-emerald-400 font-bold font-sans">
              سود: {formatCurrency(today.profit)}
            </span>
          </div>
        </div>

        {/* This Week's Sales */}
        <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">فروش ۷ روز اخیر</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white font-sans">
            {formatCurrency(week.sales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>{toPersianDigits(week.invoicesCount)} فاکتور</span>
            <span className="text-emerald-400 font-bold font-sans">
              سود: {formatCurrency(week.profit)}
            </span>
          </div>
        </div>

        {/* This Month's Sales */}
        <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">فروش ۳۰ روز اخیر</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white font-sans">
            {formatCurrency(month.sales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>{toPersianDigits(month.invoicesCount)} فاکتور</span>
            <span className="text-emerald-400 font-bold font-sans">
              سود: {formatCurrency(month.profit)}
            </span>
          </div>
        </div>

        {/* Low Stock Counter */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-md cursor-pointer hover:border-amber-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">اقلام نیازمند سفارش</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-400">
            {toPersianDigits(lowStockProducts.length)} محصول
          </div>
          <div className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1 font-semibold">
            <span>مشاهده لیست انبار و سفارش</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Main Chart + Low Stock Alert Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Timeline Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">نمودار فروش روزانه اخیر</h3>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>گزارشات تکمیلی</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} stroke="#3f3f46" />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  stroke="#3f3f46"
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'درآمد']}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '12px',
                    color: '#f4f4f5',
                    direction: 'rtl',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dashRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Warning List (4 Cols) */}
        <div className="lg:col-span-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>کالاهای در آستانه اتمام</span>
              </h3>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                {toPersianDigits(lowStockProducts.length)} کالا
              </span>
            </div>

            <div className="space-y-2.5">
              {lowStockProducts.length === 0 ? (
                <div className="text-xs text-emerald-400 py-6 text-center">
                  تمام کالاها موجودی کافی در انبار دارند.
                </div>
              ) : (
                lowStockProducts.slice(0, 5).map((p: any) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{p.name}</div>
                      <div className="text-[10px] text-slate-500">نقطه سفارش: {p.minimumStock}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px]">
                      {formatWeightOrQuantity(p.stock, p.unit)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('purchases')}
            className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-bold border border-amber-500/20 transition-colors cursor-pointer text-center"
          >
            سفارش و ثبت خرید از تامین‌کننده
          </button>
        </div>
      </div>

      {/* Recent 5 Sales Invoices Table */}
      <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">آخرین فاکتورهای صادر شده در صندوق</h3>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>مشاهده همه فاکتورها</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
              <tr>
                <th className="py-2.5 px-3">شماره فاکتور</th>
                <th className="py-2.5 px-3">تاریخ و ساعت</th>
                <th className="py-2.5 px-3">مشتری</th>
                <th className="py-2.5 px-3">صندوق‌دار</th>
                <th className="py-2.5 px-3">مبلغ فاکتور</th>
                <th className="py-2.5 px-3">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentSales.map((s: any) => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-bold font-mono text-slate-200">{s.invoiceNumber}</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">
                    {formatPersianDate(s.createdAt, true)}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-300">{s.customerName || 'عمومی'}</td>
                  <td className="py-2.5 px-3 text-slate-500">{s.sellerName}</td>
                  <td className="py-2.5 px-3 font-black text-amber-400 font-sans">
                    {formatCurrency(s.finalAmount)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      تسویه شده
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
