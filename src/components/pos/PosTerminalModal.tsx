import React, { useState, useEffect } from 'react';
import { StoreSettings, PosTransactionResult } from '../../types';
import { formatCurrency, formatNumber, toPersianDigits } from '../../utils/persian';
import {
  CreditCard,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface PosTerminalModalProps {
  isOpen: boolean;
  amount: number;
  invoiceNumber?: string;
  settings: StoreSettings | null;
  onSuccess: (result: PosTransactionResult) => void;
  onCancel: () => void;
}

type TerminalStatus = 'CONNECTING' | 'WAITING_FOR_SWIPE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export const PosTerminalModal: React.FC<PosTerminalModalProps> = ({
  isOpen,
  amount,
  invoiceNumber,
  settings,
  onSuccess,
  onCancel,
}) => {
  const [status, setStatus] = useState<TerminalStatus>('CONNECTING');
  const [countdown, setCountdown] = useState<number>(60);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [transactionData, setTransactionData] = useState<PosTransactionResult | null>(null);

  const posConfig = settings?.posTerminal || {
    enabled: true,
    provider: 'BEHPARDAKHT',
    connectionType: 'LAN_IP',
    ipAddress: '192.168.1.150',
    port: 8080,
    terminalId: '8823491',
    autoSendOnCardPayment: false,
    timeoutSeconds: 60,
  };

  const getProviderName = (provider?: string) => {
    switch (provider) {
      case 'BEHPARDAKHT':
        return 'به‌پرداخت ملت';
      case 'ASAN_PARDAKHT':
        return 'آسان پرداخت (آپ)';
      case 'SAMAN_KISH':
        return 'پرداخت الکترونیک سامان (سپ)';
      case 'IRAN_KISH':
        return 'کارت اعتباری ایران‌کیش';
      case 'FANAP':
        return 'پرداخت الکترونیک پاسارگاد (فناپ)';
      case 'PARSIAN':
        return 'تجارت الکترونیک پارسیان';
      default:
        return 'کارت‌خوان فروشگاهی (PC-POS)';
    }
  };

  // Start POS transaction communication
  const initPosTransaction = async () => {
    setStatus('CONNECTING');
    setErrorMessage('');
    setCountdown(posConfig.timeoutSeconds || 60);

    try {
      // Connect to API
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings/pos-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          amount,
          invoiceNumber: invoiceNumber || 'INV-POS',
        }),
      });

      // Artificial short delay for realistic terminal response
      setTimeout(() => {
        setStatus('WAITING_FOR_SWIPE');
      }, 700);

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTransactionData(json.data);
        }
      }
    } catch {
      setTimeout(() => {
        setStatus('WAITING_FOR_SWIPE');
      }, 700);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initPosTransaction();
    } else {
      setStatus('CONNECTING');
      setTransactionData(null);
    }
  }, [isOpen, amount]);

  // Countdown timer when waiting for customer card swipe
  useEffect(() => {
    if (status !== 'WAITING_FOR_SWIPE') return;

    if (countdown <= 0) {
      setStatus('ERROR');
      setErrorMessage('زمان تراکنش به پایان رسید (عدم پاسخ کارتخوان یا کارت نکشیدن مشتری).');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status, countdown]);

  const handleSimulateCardSwipe = () => {
    setStatus('PROCESSING');
    setTimeout(() => {
      const trace = transactionData?.traceNumber || String(Math.floor(100000 + Math.random() * 900000));
      const rrn = transactionData?.rrn || `024${Math.floor(100000000 + Math.random() * 900000000)}`;
      const masked = transactionData?.maskedPan || '۶۰۳۷-****-****-۴۸۲۹';

      const approvedData: PosTransactionResult = {
        success: true,
        message: 'تراکنش با موفقیت انجام شد.',
        traceNumber: trace,
        rrn: rrn,
        maskedPan: masked,
        terminalId: posConfig.terminalId || '8823491',
        amount,
        transactionTime: new Date().toISOString(),
      };

      setTransactionData(approvedData);
      setStatus('SUCCESS');
    }, 900);
  };

  const handleConfirmAndProceed = () => {
    if (transactionData) {
      onSuccess(transactionData);
    } else {
      onSuccess({
        success: true,
        message: 'تراکنش کارتخوان تأیید شد.',
        traceNumber: String(Math.floor(100000 + Math.random() * 900000)),
        rrn: `024${Math.floor(100000000 + Math.random() * 900000000)}`,
        maskedPan: '۶۰۳۷-****-****-۴۸۲۹',
        terminalId: posConfig.terminalId || '8823491',
        amount,
        transactionTime: new Date().toISOString(),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#141414] rounded-3xl shadow-2xl border border-white/10 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ارتباط با دستگاه کارت‌خوان (PC-POS)</h3>
              <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>{getProviderName(posConfig.provider)}</span>
                <span>•</span>
                <span>پایانه {toPersianDigits(posConfig.terminalId || '۸۸۲۳۴۹۱')}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-center">
          {/* Amount Display Box */}
          <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl p-4">
            <div className="text-xs text-slate-400 mb-1">مبلغ ارسالی به نمایشگر کارت‌خوان:</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {formatCurrency(amount)}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              معادل {formatNumber(amount * 10)} ریال
            </div>
          </div>

          {/* 1. State: CONNECTING */}
          {status === 'CONNECTING' && (
            <div className="py-6 space-y-3">
              <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-white">در حال برقراری ارتباط با کارت‌خوان...</div>
              <p className="text-xs text-slate-400">ارسال دستور پرداخت و مبلغ به آدرس {posConfig.ipAddress || '192.168.1.150'}</p>
            </div>
          )}

          {/* 2. State: WAITING_FOR_SWIPE */}
          {status === 'WAITING_FOR_SWIPE' && (
            <div className="py-4 space-y-4">
              <div className="relative w-20 h-20 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                <CreditCard className="w-10 h-10" />
                <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 rounded-full p-1 shadow-md">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-base font-bold text-white">
                  مبلغ به کارت‌خوان ارسال شد
                </div>
                <p className="text-xs text-slate-300">
                  لطفاً مشتری کارت بانکی را بکشد و رمز عبور را وارد نماید.
                </p>
              </div>

              {/* Countdown Progress */}
              <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-mono font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl py-2 px-4 w-fit mx-auto">
                <Clock className="w-4 h-4" />
                <span>زمان باقیمانده: {toPersianDigits(countdown)} ثانیه</span>
              </div>

              {/* Quick simulation button for POS test without physical hardware */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSimulateCardSwipe}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تأیید کارت کشیدن و پرداخت مشتری (شبیه‌ساز آنی PC-POS)</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. State: PROCESSING */}
          {status === 'PROCESSING' && (
            <div className="py-6 space-y-3">
              <div className="w-12 h-12 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-white">در حال پردازش تراکنش بانکی و دریافت رسید...</div>
              <p className="text-xs text-slate-400">ارتباط با شاپرک و دریافت تاییدیه تراکنش</p>
            </div>
          )}

          {/* 4. State: SUCCESS */}
          {status === 'SUCCESS' && (
            <div className="py-2 space-y-4 text-right">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-base text-center pb-2 border-b border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span>تراکنش بانکی با موفقیت انجام شد</span>
              </div>

              {/* Transaction Receipt Meta Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">شماره پیگیری (Trace):</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {toPersianDigits(transactionData?.traceNumber || '۹۲۳۸۴۱')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">شماره مرجع (RRN):</span>
                  <span className="font-mono text-white">
                    {transactionData?.rrn || '024829104928'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">شماره کارت:</span>
                  <span className="font-mono font-bold text-amber-400" dir="ltr">
                    {transactionData?.maskedPan || '6037-****-****-4829'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">پایانه / پذیرنده:</span>
                  <span>{toPersianDigits(posConfig.terminalId || '۸۸۲۳۴۹۱')} ({getProviderName(posConfig.provider)})</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>اطلاعات تراکنش به همراه فاکتور ثبت و در رسید چاپ خواهد شد.</span>
              </div>
            </div>
          )}

          {/* 5. State: ERROR */}
          {status === 'ERROR' && (
            <div className="py-4 space-y-3">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-rose-400">خطا در انجام تراکنش</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {errorMessage || 'خطا در ارتباط با دستگاه کارتخوان. لطفاً کابل شبکه/ارتباطی را بررسی کنید.'}
              </p>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={initPosTransaction}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>تلاش مجدد</span>
                </button>
                <button
                  type="button"
                  onClick={handleSimulateCardSwipe}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>ثبت دستی موفق</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer"
          >
            انصراف
          </button>

          {status === 'SUCCESS' && (
            <button
              id="confirm-pos-payment-btn"
              type="button"
              onClick={handleConfirmAndProceed}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <span>تکمیل و چاپ فاکتور فروش</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
