// Pre-bundled nut & dried fruit photos and SVG icons for fast 1-click selection

import pistachioImg from '../assets/images/pistachio_nuts_1790151537379.jpg';
import walnutsImg from '../assets/images/walnuts_nuts_1790151551832.jpg';
import almondsImg from '../assets/images/almonds_nuts_1790151564590.jpg';
import mixedNutsImg from '../assets/images/mixed_nuts_1790151580149.jpg';

export interface ProductImagePreset {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const PRODUCT_IMAGE_PRESETS: ProductImagePreset[] = [
  {
    id: 'preset-pistachio',
    name: 'پسته اعلا خندان',
    category: 'پسته و مغز',
    url: pistachioImg,
  },
  {
    id: 'preset-walnut',
    name: 'گردو و مغز گردو',
    category: 'گردو',
    url: walnutsImg,
  },
  {
    id: 'preset-almond',
    name: 'بادام درختی بو داده',
    category: 'بادام',
    url: almondsImg,
  },
  {
    id: 'preset-mixed',
    name: 'آجیل مخلوط اعلا',
    category: 'مخلوط',
    url: mixedNutsImg,
  },
  {
    id: 'preset-hazelnut',
    name: 'فندق بوداده اعلا',
    category: 'فندق',
    url: 'https://images.unsplash.com/photo-1543883441-3316e6d1c815?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-cashew',
    name: 'بادام هندی زعفرانی',
    category: 'بادام هندی',
    url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-pumpkin-seeds',
    name: 'تخمه کدو گوشتی',
    category: 'تخمه و دانه',
    url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-sunflower-seeds',
    name: 'تخمه آفتابگردان دورسفید',
    category: 'تخمه و دانه',
    url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-raisins',
    name: 'کشمش و مویز شاهانی',
    category: 'خشکبار',
    url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-figs',
    name: 'انجیر خشک استهبان',
    category: 'خشکبار',
    url: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-dates',
    name: 'خرما پیارم / مضافتی',
    category: 'خرما',
    url: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-saffron',
    name: 'زعفران قائنات',
    category: 'زعفران و هل',
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80',
  },
];

/**
 * Resizes an uploaded image file down to max dimensions (e.g. 500x500)
 * and compresses it to a lightweight data URL (WebP or JPEG).
 * This ensures lightning-fast rendering, zero server storage bloat,
 * and seamless offline backup portability.
 */
export async function optimizeImageFile(file: File, maxDim = 500, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(e.target?.result));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('خطا در بارگذاری تصویر انتخاب‌شده'));
      img.src = String(e.target?.result);
    };
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsDataURL(file);
  });
}
