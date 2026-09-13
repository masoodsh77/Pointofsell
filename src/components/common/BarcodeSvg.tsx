import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export interface BarcodeSvgProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'CODE39';
  width?: number; // width of a single bar line in pixels
  height?: number; // bar height in pixels
  displayValue?: boolean; // display numeric text under barcode
  fontSize?: number;
  font?: string;
  textAlign?: 'left' | 'center' | 'right';
  textPosition?: 'bottom' | 'top';
  textMargin?: number;
  background?: string;
  lineColor?: string;
  margin?: number;
  className?: string;
}

/**
 * Standard 1D Barcode Renderer using JsBarcode.
 * Generates official, laser & optical scanner-readable Code 128 / EAN barcodes
 * with exact quiet zones, standard checksums, and crisp edges.
 */
export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  format = 'CODE128',
  width = 1.6,
  height = 42,
  displayValue = true,
  fontSize = 12,
  font = 'monospace',
  textAlign = 'center',
  textPosition = 'bottom',
  textMargin = 3,
  background = '#ffffff',
  lineColor = '#000000',
  margin = 8,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value || !value.trim()) return;

    const cleanVal = String(value).trim();

    try {
      // If requested EAN13 but value is not 12 or 13 digits, gracefully use CODE128
      let safeFormat = format;
      if (safeFormat === 'EAN13' && !/^\d{12,13}$/.test(cleanVal)) {
        safeFormat = 'CODE128';
      }

      JsBarcode(svgRef.current, cleanVal, {
        format: safeFormat,
        width,
        height,
        displayValue,
        fontSize,
        font,
        textAlign,
        textPosition,
        textMargin,
        background,
        lineColor,
        margin,
        valid: (valid) => {
          if (!valid) {
            console.warn('JsBarcode validation warning for:', cleanVal);
          }
        },
      });
    } catch (err) {
      console.warn('Barcode render error, falling back to CODE128:', err);
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, cleanVal, {
            format: 'CODE128',
            width,
            height,
            displayValue,
            fontSize,
            font,
            textAlign,
            textPosition,
            textMargin,
            background,
            lineColor,
            margin,
          });
        }
      } catch (fallbackErr) {
        console.error('Code 128 fallback failed:', fallbackErr);
      }
    }
  }, [
    value,
    format,
    width,
    height,
    displayValue,
    fontSize,
    font,
    textAlign,
    textPosition,
    textMargin,
    background,
    lineColor,
    margin,
  ]);

  if (!value || !value.trim()) return null;

  return (
    <div className={`flex items-center justify-center overflow-hidden max-w-full ${className}`}>
      <svg
        ref={svgRef}
        className="max-w-full h-auto block"
        style={{ shapeRendering: 'crispEdges' }}
      />
    </div>
  );
};
