import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { formatCurrency, formatPersianDate, toPersianDigits } from '../../utils/persian';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Printer,
  DollarSign,
  Receipt,
  CreditCard,
  Banknote,
  PieChart as PieIcon,
  PackageCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const ReportsView: React.FC = () => {
  const [period, setPeriod] = useState<string>('30DAYS');
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<any>(null);

  const loadReport = async (p: string) => {
    setLoading(true);
    const res = await apiRequest(`/reports/summary?period=${p}`);
    if (res.success && res.data) {
      setReportData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReport(period);
  }, [period]);

  const handleExportCSV = () => {
    if (!reportData) return;
    const rows = [
      ['تاریخ', 'فروش (تومان)', 'سود خالص (تومان)', 'تعداد فاکتور'],
      ...reportData.timeline.map((t: any) => [
        t.date,
        t.revenue,
        t.profit,
        t.count,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#64748b'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">گزارشات و آنالیز مالی و فروشگاه</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تحلیل دقیق درآمد، سود ناخالص و خالص، پرفروش‌ترین محصولات و روش‌های تسویه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-bold">
            {[
              { id: 'TODAY', label: 'امروز' },
              { id: 'YESTERDAY', label: 'دیروز' },
              { id: '7DAYS', label: '۷ روز' },
              { id: '30DAYS', label: '۳۰ روز' },
              { id: 'YEAR', label: 'امسال' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  period === item.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors border border-white/5 cursor-pointer"
            title="خروجی اکسل / CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors border border-white/5 cursor-pointer"
            title="چاپ گزارش"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading || !reportData ? (
        <div className="p-12 text-center text-slate-500 text-sm">در حال بارگذاری اطلاعات گزارش...</div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold">کل درآمد فروش</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-white font-sans">
                {formatCurrency(reportData.totalSales)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">ناخالص دریافتی فاکتورها</div>
            </div>

            <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold">سود ناخالص فروش</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-emerald-400 font-sans">
                {formatCurrency(reportData.totalProfit)}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1">
                حاشیه سود:{' '}
                {reportData.totalSales > 0
                  ? toPersianDigits(
                      Math.round((reportData.totalProfit / reportData.totalSales) * 100)
                    )
                  : '۰'}
                ٪
              </div>
            </div>

            <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold">تعداد کل فاکتورها</span>
                <Receipt className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-black text-white font-sans">
                {toPersianDigits(reportData.invoiceCount)} عدد
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                میانگین هر فاکتور: {formatCurrency(reportData.averageInvoice)}
              </div>
            </div>

            <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold">مجموع تخفیفات اعمال‌شده</span>
                <PackageCheck className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-black text-rose-400 font-sans">
                {formatCurrency(reportData.totalDiscount)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">تخفیف روی فاکتورها و اقلام</div>
            </div>
          </div>

          {/* Charts Row: Revenue & Profit Timeline + Categories Share */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Area Chart: Revenue & Profit Timeline (8 Cols) */}
            <div className="lg:col-span-8 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">روند فروش و سود در طول دوره</h3>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-slate-300">فروش</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-300">سود</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full pt-4" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.timeline}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#ffffff20" />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      stroke="#ffffff20"
                      tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), '']}
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '12px',
                        color: '#f8fafc',
                        direction: 'rtl',
                        textAlign: 'right',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="فروش"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="سود"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorProf)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Categories Share (4 Cols) */}
            <div className="lg:col-span-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl space-y-4 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-white">سهم دسته‌بندی‌ها از فروش</h3>

              <div className="h-56 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.categorySales}
                      dataKey="revenue"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {reportData.categorySales.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'درآمد']}
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '11px',
                        color: '#f8fafc',
                        direction: 'rtl',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs">
                {reportData.categorySales.slice(0, 4).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-slate-300">{c.categoryName}</span>
                    </div>
                    <span className="font-bold text-amber-400 font-sans">
                      {formatCurrency(c.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Selling Products Bar Chart */}
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              ۵ محصول پرفروش‌ترین فروشگاه (از نظر مبلغ فروش)
            </h3>

            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis dataKey="productName" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#ffffff20" />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    stroke="#ffffff20"
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'مبلغ']}
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '12px',
                      color: '#f8fafc',
                      direction: 'rtl',
                    }}
                  />
                  <Bar dataKey="totalRevenue" name="مبلغ فروش" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
