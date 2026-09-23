import React, { useState } from 'react';
import { Package, ZoomIn, X } from 'lucide-react';

interface ProductThumbnailProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  allowZoom?: boolean;
}

export const ProductThumbnail: React.FC<ProductThumbnailProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  allowZoom = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px] rounded-lg',
    sm: 'w-9 h-9 text-xs rounded-xl',
    md: 'w-12 h-12 text-sm rounded-xl',
    lg: 'w-16 h-16 text-base rounded-2xl',
    xl: 'w-24 h-24 text-lg rounded-2xl',
  }[size];

  const hasValidImage = Boolean(src && !hasError);

  return (
    <>
      <div
        className={`relative shrink-0 overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center transition-all ${sizeClasses} ${
          hasValidImage && allowZoom ? 'cursor-pointer hover:border-amber-500/50 group' : ''
        } ${className}`}
        onClick={(e) => {
          if (hasValidImage && allowZoom) {
            e.stopPropagation();
            setIsZoomOpen(true);
          }
        }}
        title={hasValidImage && allowZoom ? 'مشاهده تصویر بزرگ‌تر' : alt}
      >
        {hasValidImage ? (
          <>
            <img
              src={src}
              alt={alt}
              onError={() => setHasError(true)}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            {allowZoom && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5 text-slate-500">
            <Package className="w-1/2 h-1/2 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {isZoomOpen && hasValidImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-md w-full bg-[#141414] border border-white/15 rounded-3xl p-3 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pt-1 border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white truncate max-w-[80%]">{alt}</span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black/50 aspect-square flex items-center justify-center">
              <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
