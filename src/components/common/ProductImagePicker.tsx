import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, Trash2, Sparkles, Check, ZoomIn } from 'lucide-react';
import { PRODUCT_IMAGE_PRESETS, optimizeImageFile } from '../../utils/productImagePresets';

interface ProductImagePickerProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  productName?: string;
}

export const ProductImagePicker: React.FC<ProductImagePickerProps> = ({
  value,
  onChange,
  productName = 'محصول',
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'PRESETS' | 'URL'>('PRESETS');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری معتبر (JPG, PNG, WebP) انتخاب فرمایید.');
      return;
    }

    try {
      setIsProcessing(true);
      const optimized = await optimizeImageFile(file, 500, 0.85);
      onChange(optimized);
    } catch (err) {
      console.error('Image upload optimization error:', err);
      alert('خطا در پردازش تصویر. لطفاً تصویر دیگری انتخاب نمایید.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlInput('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-300">
          تصویر کالا / عکس محصول:
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>حذف عکس</span>
          </button>
        )}
      </div>

      {/* Main Container: Left Preview + Right Selector */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
        {/* Left: Active Image Display */}
        <div className="relative shrink-0 flex flex-col items-center justify-center w-full sm:w-36 h-36 rounded-2xl bg-black/40 border border-white/10 overflow-hidden group">
          {value ? (
            <>
              <img
                src={value}
                alt={productName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewZoom(true)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white backdrop-blur-xs cursor-pointer"
                  title="بزرگ‌نمایی تصویر"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="p-1.5 bg-rose-500/80 hover:bg-rose-600 rounded-lg text-white backdrop-blur-xs cursor-pointer"
                  title="حذف عکس"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 p-2 text-center">
              <ImageIcon className="w-8 h-8 mb-1.5 text-slate-600" />
              <span className="text-[11px] font-bold">بدون عکس</span>
              <span className="text-[9px] text-slate-600 mt-0.5">یک تصویر انتخاب کنید</span>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-amber-400 gap-1 z-10">
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold">بهینه‌سازی...</span>
            </div>
          )}
        </div>

        {/* Right: Picker Options */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sub Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5 mb-3 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('PRESETS')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'PRESETS'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>عکس‌های آماده خشکبار</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('UPLOAD')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'UPLOAD'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>آپلود از سیستم</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('URL')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'URL'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>لینک عکس</span>
            </button>
          </div>

          {/* Tab 1: Presets Gallery */}
          {activeTab === 'PRESETS' && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 custom-scrollbar">
              {PRODUCT_IMAGE_PRESETS.map((preset) => {
                const isSelected = value === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChange(preset.url)}
                    className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer bg-black/40 ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/40 scale-95'
                        : 'border-white/10 hover:border-amber-500/50'
                    }`}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 text-[9px] font-bold text-white text-center truncate">
                      {preset.name}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Upload from Device */}
          {activeTab === 'UPLOAD' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-white/10 hover:border-amber-500/40 bg-black/20 hover:bg-black/30'
                }`}
              >
                <Upload className="w-6 h-6 text-amber-400 mb-1.5" />
                <span className="text-xs font-bold text-white">
                  کلیک کنید یا عکس را اینجا بکشید و رها کنید
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  پشتیبانی از JPG، PNG و WebP (فشرده‌سازی و بهینه‌سازی خودکار)
                </span>
              </div>
            </div>
          )}

          {/* Tab 3: URL Direct Link */}
          {activeTab === 'URL' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/nut-photo.jpg"
                  className="flex-1 p-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-left font-mono"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ثبت عکس
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                می‌توانید لینک اینترنتی مستقیم عکس کالا را وارد نمایید.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Large Image Preview Modal */}
      {previewZoom && value && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewZoom(false)}
        >
          <div className="relative max-w-lg max-h-[85vh] bg-[#141414] rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-2">
            <img
              src={value}
              alt={productName}
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
            <div className="p-3 text-center text-xs font-bold text-white">
              {productName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
