import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  X,
  Zap,
  ZapOff,
  SwitchCamera,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Barcode as BarcodeIcon,
  Image as ImageIcon,
  RotateCcw,
  Keyboard,
  ExternalLink,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/persian';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  subtitle?: string;
  continuous?: boolean; // if true, stays open and allows multiple scans
}

// Audio beep generator using Web Audio API
const playScanBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch {
    // Audio might be muted or not allowed without direct gesture
  }
};

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'اسکن بارکد با دوربین موبایل',
  subtitle = 'بارکد کالا را روبروی دوربین قرار دهید تا به صورت خودکار شناسایی شود',
  continuous = false,
}) => {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPermissionDismissed, setIsPermissionDismissed] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [retryKey, setRetryKey] = useState<number>(0);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'mobile-html5-barcode-scanner';
  const lastScanTimestampRef = useRef<number>(0);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleScanSuccess = useCallback((decodedText: string) => {
    const cleanText = decodedText.trim();
    if (!cleanText) return;

    const now = Date.now();
    // Debounce duplicate scans within 1.5 seconds if continuous
    if (now - lastScanTimestampRef.current < 1500 && cleanText === lastScannedCode) {
      return;
    }

    lastScanTimestampRef.current = now;
    setLastScannedCode(cleanText);
    setScanCount((prev) => prev + 1);

    if (soundEnabled) {
      playScanBeep();
    }

    if (navigator.vibrate) {
      try {
        navigator.vibrate(120);
      } catch {
        // ignore vibration error
      }
    }

    onScan(cleanText);

    if (!continuous) {
      setTimeout(() => {
        onClose();
      }, 400);
    }
  }, [continuous, lastScannedCode, onClose, onScan, soundEnabled]);

  // Scan from photo / uploaded image
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanningFile(true);
      setErrorMessage(null);

      // Create a dedicated instance or reuse current to scan file
      const tempScanner = new Html5Qrcode('file-scanner-temp-box', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      const decodedText = await tempScanner.scanFile(file, false);
      try {
        tempScanner.clear();
      } catch {}

      if (decodedText) {
        handleScanSuccess(decodedText);
      }
    } catch (err: any) {
      setErrorMessage('بارکد واضحی در تصویر پیدا نشد. لطفاً از فاصله نزدیک‌تر و با نور مناسب عکس بگیرید.');
    } finally {
      setIsScanningFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleScanSuccess(manualCodeInput.trim());
    setManualCodeInput('');
  };

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      setIsPermissionDismissed(false);
      setScannerStarted(false);
      setTorchOn(false);
      return;
    }

    let isMounted = true;
    let localScanner: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        setErrorMessage(null);
        setIsPermissionDismissed(false);
        setScannerStarted(false);

        // Check if mediaDevices exists
        if (!navigator?.mediaDevices?.getUserMedia) {
          if (isMounted) {
            setErrorMessage('مرورگر شما یا محیط فعلی از دوربین مستقیم پشتیبانی نمی‌کند. می‌توانید از گزینه گرفتن عکس یا ورود دستی استفاده کنید.');
          }
          return;
        }

        // Check element existence before starting
        const element = document.getElementById(scannerContainerId);
        if (!element) return;

        // Formats to support: EAN-13, EAN-8, Code 128, Code 39, UPC-A, UPC-E, QR, etc.
        localScanner = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        scannerRef.current = localScanner;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxWidth = Math.floor(minEdge * 0.85);
            const boxHeight = Math.floor(minEdge * 0.55); // rectangular for 1D barcodes
            return { width: Math.max(220, boxWidth), height: Math.max(140, boxHeight) };
          },
          aspectRatio: 1.0,
        };

        await localScanner.start(
          { facingMode },
          config,
          (decodedText) => {
            if (isMounted) {
              handleScanSuccess(decodedText);
            }
          },
          () => {
            // Frame scan failure is expected while searching
          }
        );

        if (!isMounted) {
          // If unmounted while start was executing, stop cleanly
          if (localScanner.isScanning) {
            localScanner.stop().then(() => {
              try { localScanner?.clear(); } catch {}
            }).catch(() => {});
          }
          return;
        }

        setScannerStarted(true);

        // Check torch capability
        try {
          const capabilities = localScanner.getRunningTrackCapabilities();
          if ((capabilities as any)?.torch) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err: any) {
        if (isMounted) {
          const errName = err?.name || '';
          const errMsg = String(err?.message || err || '');

          if (
            errName === 'NotAllowedError' ||
            errMsg.includes('Permission dismissed') ||
            errMsg.includes('Permission denied') ||
            errMsg.includes('not allowed')
          ) {
            setIsPermissionDismissed(true);
            setErrorMessage('دسترسی به دوربین توسط کاربر یا مرورگر تایید نشد. می‌توانید دسترسی را مجدداً تایید کنید یا از عکسبرداری و ورود دستی استفاده نمایید.');
          } else if (errName === 'NotFoundError' || errMsg.includes('no camera') || errMsg.includes('not found')) {
            setErrorMessage('دوربینی بر روی این دستگاه پیدا نشد.');
          } else {
            setErrorMessage('امکان فعال‌سازی زنده دوربین وجود ندارد. می‌توانید عکس بارکد را ارسال کرده یا دستی وارد کنید.');
          }
        }
      }
    };

    // Small delay to ensure modal DOM is mounted
    const timer = setTimeout(startScanner, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      const scanner = scannerRef.current || localScanner;
      scannerRef.current = null;

      if (scanner) {
        try {
          if (scanner.isScanning) {
            scanner
              .stop()
              .then(() => {
                try {
                  scanner.clear();
                } catch {
                  // ignore
                }
              })
              .catch(() => {
                try {
                  scanner.clear();
                } catch {
                  // ignore
                }
              });
          } else {
            try {
              scanner.clear();
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, facingMode, handleScanSuccess, retryKey]);

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* Hidden file input for barcode scanning from photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Hidden element for file scanning */}
      <div id="file-scanner-temp-box" className="hidden" />

      <div className="bg-[#141414] rounded-3xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-right">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
          {/* HTML5 QR Container */}
          <div id={scannerContainerId} className="w-full h-full min-h-[300px]" />

          {/* Scanner Overlay Line Animation */}
          {scannerStarted && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {/* Laser animation */}
              <div className="w-3/4 h-36 border-2 border-amber-400/80 rounded-2xl relative flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                {/* Corner Accents */}
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400" />

                {/* Animated Red/Amber Scan Laser */}
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse shadow-[0_0_8px_#f59e0b]" />
              </div>
              <span className="mt-3 text-[11px] font-bold text-amber-300/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                بارکد را درون کادر قرار دهید
              </span>
            </div>
          )}

          {/* Loading File Scan Overlay */}
          {isScanningFile && (
            <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3 z-30">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-amber-300 font-bold">در حال پردازش و استخراج بارکد از تصویر...</p>
            </div>
          )}

          {/* Error & Permission Handling Display */}
          {errorMessage && !isScanningFile && (
            <div className="absolute inset-0 bg-black/95 p-5 flex flex-col items-center justify-center text-center space-y-3.5 z-20 overflow-y-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                {isPermissionDismissed ? <AlertCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6 text-rose-400" />}
              </div>
              
              <div className="space-y-1 max-w-xs">
                <p className="text-xs font-bold text-white">
                  {isPermissionDismissed ? 'دسترسی دوربین نیاز است' : 'عدم برقراری ارتباط با دوربین'}
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">{errorMessage}</p>
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-xs space-y-2 pt-1">
                {/* Retry live camera */}
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    setRetryKey((k) => k + 1);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>تلاش مجدد و اجازه دسترسی</span>
                </button>

                {/* Snap/Upload Photo Fallback */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer border border-amber-500/20"
                >
                  <Camera className="w-4 h-4" />
                  <span>گرفتن عکس از بارکد یا انتخاب فایل</span>
                </button>

                {/* If in iframe, suggest opening in new tab */}
                {isInIframe && (
                  <button
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl text-[11px] flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>باز کردن برنامه در تب جدید</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Top Controls on Camera (Torch / Audio / Flip / Photo Upload) */}
          {scannerStarted && (
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-auto">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-2xl border border-white/10">
                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      torchOn ? 'bg-amber-500 text-slate-950 font-bold' : 'text-white hover:bg-white/10'
                    }`}
                    title={torchOn ? 'خاموش کردن چراغ' : 'روشن کردن چراغ قوه'}
                  >
                    {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                  </button>
                )}

                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    soundEnabled ? 'text-amber-400 hover:bg-white/10' : 'text-slate-500 hover:bg-white/10'
                  }`}
                  title={soundEnabled ? 'قطع صدای بیپ' : 'فعال‌سازی صدای بیپ'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleCamera}
                  className="p-2 rounded-xl text-white hover:bg-white/10 text-xs transition-colors cursor-pointer"
                  title="تغییر دوربین جلو / پشت"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>

                {/* Upload Photo Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-white hover:bg-white/10 text-xs transition-colors cursor-pointer"
                  title="انتخاب عکس بارکد از گالری یا دوربین"
                >
                  <ImageIcon className="w-4 h-4 text-amber-300" />
                </button>
              </div>

              {continuous && (
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>اسکن متوالی: {toPersianDigits(scanCount)} بارکد</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Last Scanned Badge & Alternative Input */}
        <div className="p-4 bg-[#141414] border-t border-white/5 space-y-3">
          {/* Manual Input Toggle or Form */}
          {showManualInput ? (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                placeholder="کد بارکد یا SKU را تایپ کنید..."
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md"
              >
                ثبت
              </button>
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="px-2.5 py-2 bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs"
              >
                ✕
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>تایپ دستی بارکد</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>عکسبرداری / آپلود عکس بارکد</span>
              </button>
            </div>
          )}

          {lastScannedCode ? (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">آخرین بارکد ثبت‌شده:</div>
                  <div className="font-mono font-bold text-emerald-300">{lastScannedCode}</div>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                ثبت شد
              </span>
            </div>
          ) : (
            <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <BarcodeIcon className="w-3.5 h-3.5 text-amber-400/80" />
              <span>پشتیبانی از انواع بارکدهای خطی، میله‌ای و کدهای QR</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 font-bold rounded-xl text-xs transition-colors border border-white/5 cursor-pointer"
            >
              {continuous ? 'اتمام اسکن و بستن' : 'بستن پنجره'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

