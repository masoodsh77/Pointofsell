import { Sale, Purchase, StoreSettings, ReceiptTemplateType } from '../types';
import {
  formatCurrency,
  formatPersianDate,
  formatWeightOrQuantity,
  getPaymentMethodLabel,
  toPersianDigits
} from './persian';

/**
 * Generate Printable HTML based on selected template
 */
export function generateReceiptHtml(
  sale: Sale,
  settings: StoreSettings | null,
  template: ReceiptTemplateType = 'CLASSIC_80'
): string {
  const storeName = settings?.storeName || 'فروشگاه آجیل و خشکبار زعفران طلایی';
  const storePhone = settings?.storePhone || '۰۲۱-۸۸۷۷۶۶۵۵';
  const storeAddress = settings?.storeAddress || 'تهران، خیابان ولیعصر، بالاتر از میدان ونک';
  const footerText = settings?.receiptFooter || 'از خرید و اعتماد شما صمیمانه سپاسگزاریم.';

  // 1. TEMPLATE: COMPACT_58 (Mini 58mm Thermal Printer)
  if (template === 'COMPACT_58') {
    const itemsHtml = sale.items
      .map(
        (item) => `
        <tr style="border-bottom: 1px dotted #94a3b8;">
          <td style="padding: 4px 2px; text-align: right;">
            <div style="font-weight: bold; font-size: 9.5px; color: #000;">${item.productName}</div>
            <div style="font-size: 8.5px; color: #555;">${formatWeightOrQuantity(item.quantity, item.unit)} × ${formatCurrency(item.unitSalePrice, '')}</div>
          </td>
          <td style="padding: 4px 2px; text-align: left; font-weight: bold; font-size: 9.5px; white-space: nowrap; color: #000;">
            ${formatCurrency(item.total, '')}
          </td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>فاکتور ${sale.invoiceNumber}</title>
        <style>
          @page { size: 58mm auto; margin: 2mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, Tahoma, sans-serif; }
          body { width: 54mm; margin: 0 auto; padding: 4px; background: #fff; color: #000; font-size: 9.5px; line-height: 1.3; }
          .center { text-align: center; }
          .b-bottom { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
          .bold { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
          .row { display: flex; justify-content: space-between; padding: 1.5px 0; }
          .grand { font-size: 11px; font-weight: 900; border-top: 1px solid #000; padding-top: 3px; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div class="center b-bottom">
          <div style="font-size: 11px; font-weight: 900;">${storeName}</div>
          <div style="font-size: 8.5px; color: #333;">تلفن: ${storePhone}</div>
        </div>
        <div class="b-bottom" style="font-size: 9px;">
          <div class="row"><span>شماره:</span><span class="bold">${sale.invoiceNumber}</span></div>
          <div class="row"><span>تاریخ:</span><span>${formatPersianDate(sale.createdAt, true)}</span></div>
          <div class="row"><span>مشتری:</span><span class="bold">${sale.customerName || 'عمومی'}</span></div>
          <div class="row"><span>صندوق‌دار:</span><span>${sale.sellerName}</span></div>
        </div>
        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000; font-size: 8.5px;">
              <th style="text-align: right; padding-bottom: 2px;">کالا</th>
              <th style="text-align: left; padding-bottom: 2px;">جمع</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="b-bottom">
          <div class="row"><span>جمع:</span><span>${formatCurrency(sale.subtotal, '')}</span></div>
          ${sale.discount > 0 ? `<div class="row" style="color: #000;"><span>تخفیف:</span><span>- ${formatCurrency(sale.discount, '')}</span></div>` : ''}
          <div class="row grand"><span>قابل پرداخت:</span><span>${formatCurrency(sale.finalAmount)}</span></div>
          <div class="row" style="font-size: 8.5px; margin-top: 2px;"><span>پرداخت:</span><span>${getPaymentMethodLabel(sale.paymentMethod)}</span></div>
          ${sale.cardTraceNumber ? `<div class="row" style="font-size: 8px;"><span>پیگیری پوز:</span><span>${sale.cardTraceNumber}</span></div>` : ''}
        </div>
        <div class="center" style="font-size: 8.5px; margin-top: 4px;">
          <div>${footerText}</div>
          <div style="font-family: monospace; font-size: 8.5px; margin-top: 2px;">* ${sale.invoiceNumber} *</div>
        </div>
        <script>window.onload = function() { window.focus(); setTimeout(function() { window.print(); }, 250); };</script>
      </body>
      </html>
    `;
  }

  // 2. TEMPLATE: MODERN_QR (Modern Graphic with QR & Clean Layout)
  if (template === 'MODERN_QR') {
    const itemsHtml = sale.items
      .map(
        (item, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px 4px; text-align: center; color: #64748b; font-size: 10px;">${toPersianDigits(idx + 1)}</td>
          <td style="padding: 6px 4px; text-align: right;">
            <div style="font-weight: 800; font-size: 11px; color: #0f172a;">${item.productName}</div>
            <div style="font-size: 9.5px; color: #64748b;">${formatCurrency(item.unitSalePrice)} فی</div>
          </td>
          <td style="padding: 6px 4px; text-align: center; font-size: 10.5px; font-weight: bold; color: #1e293b;">
            ${formatWeightOrQuantity(item.quantity, item.unit)}
          </td>
          <td style="padding: 6px 4px; text-align: left; font-size: 11px; font-weight: 800; color: #0f172a;">
            ${formatCurrency(item.total, '')}
          </td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>رسید مدرن - ${sale.invoiceNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 3mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, 'Vazirmatn', sans-serif; }
          body { width: 76mm; margin: 0 auto; padding: 10px; background: #fff; color: #0f172a; font-size: 11px; line-height: 1.4; }
          .card { border: 1.5px solid #0f172a; border-radius: 12px; padding: 10px; }
          .logo-badge { display: inline-block; background: #0f172a; color: #fff; font-size: 9px; font-weight: bold; padding: 2px 8px; border-radius: 6px; margin-bottom: 4px; }
          .header { text-align: center; padding-bottom: 8px; border-bottom: 2px dashed #0f172a; margin-bottom: 8px; }
          .title { font-size: 14px; font-weight: 900; color: #0f172a; }
          .grid { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 10.5px; }
          th { background: #f8fafc; padding: 5px 4px; font-size: 10px; font-weight: 800; border-bottom: 1.5px solid #cbd5e1; }
          .totals { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; margin-top: 6px; }
          .grand-row { font-size: 13px; font-weight: 900; color: #0f172a; border-top: 1.5px solid #cbd5e1; padding-top: 4px; margin-top: 4px; }
          .qr-box { text-align: center; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo-badge">فروشگاه تخصصی</div>
            <div class="title">${storeName}</div>
            <div style="font-size: 10px; color: #475569; margin-top: 2px;">${storeAddress}</div>
            <div style="font-size: 10px; color: #475569;">تلفن: ${storePhone}</div>
          </div>

          <div style="padding-bottom: 6px; border-bottom: 1px dashed #cbd5e1; font-size: 10.5px;">
            <div class="grid"><span>شماره فاکتور:</span><strong style="font-family: monospace;">${sale.invoiceNumber}</strong></div>
            <div class="grid"><span>تاریخ و ساعت:</span><span>${formatPersianDate(sale.createdAt, true)}</span></div>
            <div class="grid"><span>مشتری گرامی:</span><strong>${sale.customerName || 'عمومی'}</strong></div>
            <div class="grid"><span>صندوق‌دار:</span><span>${sale.sellerName}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 10%;">#</th>
                <th style="text-align: right;">کالا</th>
                <th style="text-align: center;">مقدار</th>
                <th style="text-align: left;">مبلغ</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div class="totals">
            <div class="grid"><span>جمع کل خرید:</span><span>${formatCurrency(sale.subtotal)}</span></div>
            ${sale.discount > 0 ? `<div class="grid" style="color: #dc2626; font-weight: bold;"><span>تخفیف ویژه:</span><span>- ${formatCurrency(sale.discount)}</span></div>` : ''}
            <div class="grid grand-row"><span>مبلغ نهایی:</span><span>${formatCurrency(sale.finalAmount)}</span></div>
            <div class="grid" style="font-size: 10px; color: #475569; margin-top: 3px;">
              <span>روش پرداخت:</span><span>${getPaymentMethodLabel(sale.paymentMethod)}</span>
            </div>
            ${sale.cardTraceNumber ? `
              <div class="grid" style="font-size: 9.5px; color: #475569;">
                <span>شماره پیگیری کارتخوان:</span><span style="font-family: monospace;">${sale.cardTraceNumber}</span>
              </div>
              <div class="grid" style="font-size: 9.5px; color: #475569;">
                <span>شماره مرجع (RRN):</span><span style="font-family: monospace;">${sale.cardRRN || '-'}</span>
              </div>
            ` : ''}
          </div>

          <div class="qr-box">
            <div style="font-size: 9.5px; color: #475569; margin-bottom: 4px;">${footerText}</div>
            <div style="display: flex; justify-content: center; margin: 4px 0;">
              <!-- Lightweight SVG QR Icon representation -->
              <svg width="60" height="60" viewBox="0 0 100 100" fill="#0f172a">
                <rect x="10" y="10" width="30" height="30" fill="none" stroke="#0f172a" stroke-width="8"/>
                <rect x="20" y="20" width="10" height="10"/>
                <rect x="60" y="10" width="30" height="30" fill="none" stroke="#0f172a" stroke-width="8"/>
                <rect x="70" y="20" width="10" height="10"/>
                <rect x="10" y="60" width="30" height="30" fill="none" stroke="#0f172a" stroke-width="8"/>
                <rect x="20" y="70" width="10" height="10"/>
                <rect x="55" y="55" width="10" height="10"/>
                <rect x="75" y="55" width="15" height="10"/>
                <rect x="55" y="75" width="20" height="15"/>
                <rect x="80" y="75" width="10" height="15"/>
              </svg>
            </div>
            <div style="font-family: monospace; font-size: 9px; letter-spacing: 2px; color: #64748b;">${sale.invoiceNumber}</div>
          </div>
        </div>
        <script>window.onload = function() { window.focus(); setTimeout(function() { window.print(); }, 250); };</script>
      </body>
      </html>
    `;
  }

  // 3. TEMPLATE: OFFICIAL_A5 (Official Company/Tax Format A5)
  if (template === 'OFFICIAL_A5') {
    const itemsHtml = sale.items
      .map(
        (item, idx) => `
        <tr style="border-bottom: 1px solid #cbd5e1;">
          <td style="padding: 7px 6px; text-align: center; border-left: 1px solid #cbd5e1;">${toPersianDigits(idx + 1)}</td>
          <td style="padding: 7px 6px; text-align: right; font-weight: bold; border-left: 1px solid #cbd5e1;">${item.productName}</td>
          <td style="padding: 7px 6px; text-align: center; border-left: 1px solid #cbd5e1;">${formatWeightOrQuantity(item.quantity, item.unit)}</td>
          <td style="padding: 7px 6px; text-align: center; border-left: 1px solid #cbd5e1;">${formatCurrency(item.unitSalePrice)}</td>
          <td style="padding: 7px 6px; text-align: center; border-left: 1px solid #cbd5e1;">${item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
          <td style="padding: 7px 6px; text-align: left; font-weight: bold;">${formatCurrency(item.total)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>فاکتور رسمی فروش - ${sale.invoiceNumber}</title>
        <style>
          @page { size: A5 landscape; margin: 6mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, Tahoma, sans-serif; }
          body { padding: 10px; color: #0f172a; font-size: 11px; line-height: 1.4; }
          .header-box { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
          .party-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1px solid #cbd5e1; font-size: 10.5px; }
          .party-table td { padding: 5px 8px; border: 1px solid #cbd5e1; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1.5px solid #0f172a; font-size: 11px; }
          .items-table th { background: #f1f5f9; padding: 7px 6px; border: 1px solid #cbd5e1; border-bottom: 1.5px solid #0f172a; font-weight: 800; }
          .footer-grid { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; }
          .sign-box { border: 1px dashed #94a3b8; border-radius: 8px; height: 60px; padding: 6px; text-align: center; font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div style="font-size: 15px; font-weight: 900;">${storeName}</div>
            <div style="font-size: 11px; color: #475569;">صورت‌حساب رسمی فروش کالا و خدمات</div>
          </div>
          <div style="text-align: left; font-size: 11px;">
            <div><strong>شماره فاکتور:</strong> <span style="font-family: monospace; font-size: 13px;">${sale.invoiceNumber}</span></div>
            <div><strong>تاریخ:</strong> ${formatPersianDate(sale.createdAt, true)}</div>
            <div><strong>صندوق‌دار:</strong> ${sale.sellerName}</div>
          </div>
        </div>

        <table class="party-table">
          <tr style="background: #f8fafc;">
            <td style="width: 50%; font-weight: bold;">مشخصات فروشنده</td>
            <td style="width: 50%; font-weight: bold;">مشخصات خریدار</td>
          </tr>
          <tr>
            <td>
              <div><strong>فروشگاه:</strong> ${storeName}</div>
              <div><strong>تلفن:</strong> ${storePhone}</div>
              <div><strong>نشانی:</strong> ${storeAddress}</div>
            </td>
            <td>
              <div><strong>نام خریدار:</strong> ${sale.customerName || 'مشتری محترم (حضوری)'}</div>
              <div><strong>شماره تماس:</strong> ${sale.customerPhone || '-'}</div>
              <div><strong>نوع تسویه:</strong> ${getPaymentMethodLabel(sale.paymentMethod)}</div>
            </td>
          </tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">ردیف</th>
              <th style="text-align: right; width: 40%;">شرح کالا یا خدمات</th>
              <th style="width: 15%;">مقدار / تعداد</th>
              <th style="width: 15%;">مبلغ واحد (فی)</th>
              <th style="width: 10%;">تخفیف</th>
              <th style="width: 15%; text-align: left;">مبلغ کل (تومان)</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
          <div style="width: 300px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; background: #f8fafc; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>جمع کل اقلام:</span><strong>${formatCurrency(sale.subtotal)}</strong>
            </div>
            ${sale.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; color: #b91c1c; margin-bottom: 3px;">
                <span>مجموع تخفیفات:</span><strong>- ${formatCurrency(sale.discount)}</strong>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; border-top: 1.5px solid #0f172a; padding-top: 4px;">
              <span>مبلغ نهایی قابل پرداخت:</span><strong style="color: #0f172a;">${formatCurrency(sale.finalAmount)}</strong>
            </div>
          </div>
        </div>

        <div class="footer-grid">
          <div style="flex: 2; font-size: 10px; color: #475569; padding-top: 8px;">
            <p><strong>توضیحات:</strong> ${footerText}</p>
            ${sale.cardTraceNumber ? `<p style="margin-top: 3px;">کارت‌خوان: شماره پیگیری ${sale.cardTraceNumber} | ارجاع ${sale.cardRRN || '-'}</p>` : ''}
          </div>
          <div style="flex: 1;" class="sign-box">مهر و امضای فروشنده</div>
          <div style="flex: 1;" class="sign-box">امضای خریدار / تحویل‌گیرنده</div>
        </div>

        <script>window.onload = function() { window.focus(); setTimeout(function() { window.print(); }, 250); };</script>
      </body>
      </html>
    `;
  }

  // 4. DEFAULT: CLASSIC_80 (Standard 80mm POS Thermal Receipt)
  const itemsHtml = sale.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px dashed #cbd5e1;">
        <td style="padding: 6px 4px; vertical-align: top; text-align: right;">
          <div style="font-weight: bold; font-size: 11px; color: #0f172a;">${item.productName}</div>
          <div style="font-size: 10px; color: #64748b;">${formatCurrency(item.unitSalePrice)} فی</div>
        </td>
        <td style="padding: 6px 4px; vertical-align: top; text-align: center; font-size: 11px; color: #1e293b; white-space: nowrap;">
          ${formatWeightOrQuantity(item.quantity, item.unit)}
        </td>
        <td style="padding: 6px 4px; vertical-align: top; text-align: left; font-size: 11px; font-weight: bold; color: #0f172a; white-space: nowrap;">
          ${formatCurrency(item.total, '')}
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="utf-8">
      <title>فاکتور فروش - ${sale.invoiceNumber}</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, 'Vazirmatn', sans-serif; }
        body { width: 78mm; margin: 0 auto; padding: 10px; background: #fff; color: #0f172a; font-size: 11px; line-height: 1.4; }
        .header { text-align: center; padding-bottom: 8px; border-bottom: 1px dashed #64748b; margin-bottom: 8px; }
        .store-name { font-size: 14px; font-weight: 900; color: #0f172a; margin-bottom: 3px; }
        .store-info { font-size: 10px; color: #475569; line-height: 1.3; }
        .meta-table { width: 100%; margin-bottom: 8px; font-size: 10.5px; border-bottom: 1px dashed #64748b; padding-bottom: 6px; }
        .meta-table tr td { padding: 2px 0; }
        .meta-label { color: #64748b; width: 40%; }
        .meta-val { font-weight: bold; text-align: left; color: #0f172a; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .items-table th { border-bottom: 1px solid #94a3b8; padding: 4px; font-size: 10px; color: #475569; font-weight: bold; }
        .totals-box { border-top: 1px dashed #64748b; border-bottom: 1px dashed #64748b; padding: 8px 0; margin-bottom: 10px; }
        .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
        .grand-total { font-size: 13px; font-weight: 900; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 5px; margin-top: 4px; }
        .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 8px; line-height: 1.4; }
        .barcode-box { text-align: center; margin-top: 6px; font-family: monospace; font-size: 10px; letter-spacing: 2px; font-weight: bold; }
        @media print {
          body { width: 100%; padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div class="store-info">تلفن: ${storePhone}</div>
        <div class="store-info">${storeAddress}</div>
      </div>

      <table class="meta-table">
        <tr><td class="meta-label">شماره فاکتور:</td><td class="meta-val">${sale.invoiceNumber}</td></tr>
        <tr><td class="meta-label">تاریخ و زمان:</td><td class="meta-val">${formatPersianDate(sale.createdAt, true)}</td></tr>
        <tr><td class="meta-label">صندوق‌دار:</td><td class="meta-val">${sale.sellerName}</td></tr>
        <tr><td class="meta-label">نام مشتری:</td><td class="meta-val">${sale.customerName || 'مشتری عمومی (حضوری)'}</td></tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: right;">شرح کالا</th>
            <th style="text-align: center;">مقدار</th>
            <th style="text-align: left;">مبلغ کل</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div class="totals-box">
        <div class="total-row"><span>جمع اقلام:</span><span>${formatCurrency(sale.subtotal)}</span></div>
        ${sale.discount > 0 ? `<div class="total-row" style="color: #b91c1c; font-weight: bold;"><span>تخفیف:</span><span>- ${formatCurrency(sale.discount)}</span></div>` : ''}
        <div class="total-row grand-total"><span>مبلغ قابل پرداخت:</span><span>${formatCurrency(sale.finalAmount)}</span></div>
        <div class="total-row" style="font-size: 10px; color: #475569; margin-top: 4px;">
          <span>روش پرداخت:</span><span>${getPaymentMethodLabel(sale.paymentMethod)}</span>
        </div>
        ${sale.cardTraceNumber ? `
          <div class="total-row" style="font-size: 9.5px; color: #475569;">
            <span>پیگیری پوز:</span><span>${sale.cardTraceNumber}</span>
          </div>
        ` : ''}
      </div>

      <div class="footer">
        <div>${footerText}</div>
        <div class="barcode-box">* ${sale.invoiceNumber} *</div>
      </div>

      <script>
        window.onload = function() {
          window.focus();
          setTimeout(function() { window.print(); }, 250);
        };
      </script>
    </body>
    </html>
  `;
}

/**
 * Robust Cross-browser & Iframe-safe Receipt Printer
 */
export function printReceipt(
  sale: Sale,
  settings: StoreSettings | null,
  template?: ReceiptTemplateType
): void {
  const chosenTemplate = template || settings?.receiptTemplate || 'CLASSIC_80';
  const htmlContent = generateReceiptHtml(sale, settings, chosenTemplate);

  const printWindow = window.open('', '_blank', 'width=480,height=700');

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Fallback: If popup blocked by browser iframe, create an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      }, 500);
    }
  }
}

/**
 * Print Purchase Invoice
 */
export function printPurchaseReceipt(purchase: Purchase, settings: StoreSettings | null): void {
  const printWindow = window.open('', '_blank', 'width=500,height=700');

  const itemsHtml = purchase.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 4px; text-align: center; color: #64748b;">${toPersianDigits(idx + 1)}</td>
        <td style="padding: 6px 4px; text-align: right; font-weight: bold; color: #0f172a;">${item.productName}</td>
        <td style="padding: 6px 4px; text-align: center; color: #1e293b;">${formatWeightOrQuantity(item.quantity, item.unit)}</td>
        <td style="padding: 6px 4px; text-align: center; color: #475569;">${formatCurrency(item.unitPurchasePrice)}</td>
        <td style="padding: 6px 4px; text-align: left; font-weight: bold; color: #0f172a;">${formatCurrency(item.total)}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="utf-8">
      <title>فاکتور خرید کالا - ${purchase.invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, Tahoma, sans-serif; }
        body { padding: 20px; color: #0f172a; font-size: 12px; }
        .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
        .title { font-size: 16px; font-weight: 900; }
        .meta-grid { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f1f5f9; padding: 8px; font-size: 11px; border: 1px solid #cbd5e1; }
        td { border: 1px solid #cbd5e1; font-size: 11px; }
        .total-box { text-align: left; font-size: 13px; font-weight: bold; margin-top: 10px; padding: 8px; background: #f8fafc; border: 1px solid #cbd5e1; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${settings?.storeName || 'فروشگاه زعفران طلایی'}</div>
        <div style="font-size: 13px; color: #475569; margin-top: 3px;">فاکتور ورودی و ورود به انبار</div>
      </div>
      <div class="meta-grid">
        <div>
          <div><strong>شماره سند:</strong> ${purchase.invoiceNumber}</div>
          <div><strong>تامین‌کننده:</strong> ${purchase.supplierName}</div>
        </div>
        <div>
          <div><strong>تاریخ ثبت:</strong> ${formatPersianDate(purchase.createdAt, true)}</div>
          <div><strong>مسئول ثبت:</strong> ${purchase.userName}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>ردیف</th>
            <th>شرح کالا</th>
            <th>مقدار</th>
            <th>قیمت خرید واحد</th>
            <th>مبلغ کل</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="total-box">مبلغ کل فاکتور: ${formatCurrency(purchase.totalAmount)}</div>
      <script>
        window.onload = function() {
          window.focus();
          setTimeout(function() { window.print(); }, 300);
        };
      </script>
    </body>
    </html>
  `;

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
