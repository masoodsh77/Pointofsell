import React, { useState, useEffect } from 'react';
import { BackupMeta } from '../../types';
import { apiRequest } from '../../services/api';
import { formatPersianDate, toPersianDigits } from '../../utils/persian';
import { DatabaseBackup, Download, RotateCcw, Plus, CheckCircle, AlertCircle, ShieldCheck, HardDrive } from 'lucide-react';

export const BackupView: React.FC = () => {
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadBackups = async () => {
    const res = await apiRequest<BackupMeta[]>('/backup');
    if (res.success && res.data) setBackups(res.data);
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateManualBackup = async () => {
    setIsBackingUp(true);
    setErrorMsg(null);

    const res = await apiRequest('/backup/create', { method: 'POST' });
    if (res.success) {
      setSuccessMsg('یک نسخه پشتیبان کامل و امن از تمام اطلاعات فروشگاه تهیه و ذخیره شد.');
      loadBackups();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message || 'خطا در ایجاد بکاپ');
    }
    setIsBackingUp(false);
  };

  const handleRestore = async (b: BackupMeta) => {
    if (
      !window.confirm(
        `آیا از بازیابی اطلاعات به تاریخ ${formatPersianDate(b.createdAt, true)} اطمینان دارید؟\n(یک نسخه اضطراری از داده‌های فعلی نیز قبل از بازیابی ذخیره خواهد شد)`
      )
    ) {
      return;
    }

    setIsRestoring(true);
    setErrorMsg(null);

    const res = await apiRequest('/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ filename: b.filename }),
    });

    if (res.success) {
      setSuccessMsg('اطلاعات سیستم با موفقیت به تاریخ انتخابی بازیابی شد. صفحه مجدداً بارگذاری خواهد شد.');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setErrorMsg(res.message || 'خطا در بازیابی اطلاعات');
    }
    setIsRestoring(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${toPersianDigits(bytes)} B`;
    return `${toPersianDigits((bytes / 1024).toFixed(1))} KB`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <DatabaseBackup className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">پشتیبان‌گیری و بازیابی اطلاعات (Backup & Restore)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تهیه نسخه پشتیبان خودکار روزانه و دستی، دانلود فایل JSON و بازیابی اضطراری اطلاعات
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateManualBackup}
          disabled={isBackingUp}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{isBackingUp ? 'در حال ایجاد بکاپ...' : 'ایجاد نسخه پشتیبان دستی'}</span>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Auto Backup Info Card */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center gap-3 text-xs text-blue-300">
        <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
        <div>
          <div className="font-bold text-white mb-0.5">سیستم پشتیبان‌گیری هوشمند فعال است</div>
          <div className="text-slate-400">
            سیستم به صورت خودکار در پایان هر روز یک نسخه پشتیبان کامل از دیتابیس، فاکتورها و انبار تهیه
            کرده و نسخه‌های قدیمی‌تر از ۳۰ روز را به صورت ایمن پاکسازی می‌نماید.
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">لیست آرشیو نسخه‌های پشتیبان موجود</h3>
          <span className="text-xs text-slate-400">
            مجموعاً {toPersianDigits(backups.length)} نسخه ذخیره‌شده
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">نام فایل پشتیبان</th>
                <th className="py-3.5 px-3">تاریخ و ساعت ایجاد</th>
                <th className="py-3.5 px-3">نوع بکاپ</th>
                <th className="py-3.5 px-3">حجم فایل</th>
                <th className="py-3.5 px-3">آمار رکوردها</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    هنوز نسخه پشتیبانی در سیستم ذخیره نشده است.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400 text-[11px]">
                      {b.filename}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {formatPersianDate(b.createdAt, true)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.isManual
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {b.isManual ? 'دستی' : 'خودکار روزانه'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {formatFileSize(b.fileSizeBytes)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {toPersianDigits(b.recordCounts?.products || 0)} کالا | {toPersianDigits(b.recordCounts?.sales || 0)} فاکتور
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`/api/backup/download/${b.filename}`}
                          download={b.filename}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors"
                          title="دانلود فایل بکاپ"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleRestore(b)}
                          disabled={isRestoring}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors border border-rose-500/20"
                          title="بازیابی دیتابیس به این نسخه"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>بازیابی</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
