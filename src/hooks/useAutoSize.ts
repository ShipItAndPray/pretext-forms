import { useMemo } from 'react';
import { prepare, layout } from '@chenglou/pretext';

export interface AutoSizeResult {
  /** Total height in px including padding */
  height: number;
  /** Measured text width (for inputs) */
  width: number;
  /** Number of lines the text wraps to */
  lineCount: number;
  /** Style object ready to spread onto the element */
  style: { height: string; width?: string };
}

export interface AutoSizeFontConfig {
  /** CSS font shorthand string, e.g. "400 14px / 20px Inter, sans-serif" */
  font: string;
  /** Font size in px (used for lineHeight fallback and row calculations) */
  fontSize: number;
  /** Line height in px */
  lineHeight: number;
}

export interface AutoSizePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AutoSizeOptions {
  minRows?: number;
  maxRows?: number;
  padding?: AutoSizePadding;
}

/**
 * Core hook: calculates element dimensions from text content using @chenglou/pretext.
 *
 * No DOM measurement happens here -- only pure text layout calculation.
 * This means the height is known before the browser paints, eliminating CLS.
 *
 * @param text - The text content to measure
 * @param fontConfig - Font shorthand + size + lineHeight
 * @param maxWidth - Available width for the text (content area, excluding padding)
 * @param options - min/max row constraints and padding
 */
export function useAutoSize(
  text: string,
  fontConfig: AutoSizeFontConfig,
  maxWidth: number,
  options?: AutoSizeOptions,
): AutoSizeResult {
  const { font, lineHeight, fontSize } = fontConfig;
  const minRows = options?.minRows ?? 1;
  const maxRows = options?.maxRows ?? Infinity;
  const padding = options?.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };

  return useMemo(() => {
    // Guard: if maxWidth is 0 or negative, we can't lay out yet
    if (maxWidth <= 0) {
      const fallbackHeight = minRows * lineHeight + padding.top + padding.bottom;
      return {
        height: fallbackHeight,
        width: 0,
        lineCount: minRows,
        style: { height: `${fallbackHeight}px` },
      };
    }

    // Use the text or a single space (empty text still needs at least 1 line)
    const content = text || ' ';

    // prepare() builds the internal layout data structure.
    // font must be a CSS font shorthand: "weight size/lineHeight family"
    const prepared = prepare(content, font);

    // layout() returns { lineCount, height } for the given maxWidth and lineHeight.
    const result = layout(prepared, maxWidth, lineHeight);

    // Clamp line count between minRows and maxRows
    const clampedLineCount = Math.max(minRows, Math.min(maxRows, result.lineCount));
    const textHeight = clampedLineCount * lineHeight;
    const totalHeight = textHeight + padding.top + padding.bottom;

    // For width measurement (used by AutoInput), measure single-line width.
    // If the text fits in one line, the width is approximated from the layout.
    // For multi-line, width = maxWidth.
    const measuredWidth = result.lineCount <= 1
      ? Math.min(result.height / lineHeight * maxWidth, maxWidth) // rough approximation
      : maxWidth;

    // For single-line width: do a layout at a very large maxWidth to get actual single-line width
    let singleLineWidth = maxWidth;
    if (result.lineCount <= 1) {
      const wideResult = layout(prepared, 1e6, lineHeight);
      // If it fits in one line at huge width, the height = 1 * lineHeight
      // We can derive width from the fact that lineCount=1
      // Actually pretext doesn't return width directly, but we know it fits in maxWidth
      singleLineWidth = maxWidth; // We'll handle this differently in AutoInput
    }

    return {
      height: totalHeight,
      width: measuredWidth,
      lineCount: clampedLineCount,
      style: { height: `${totalHeight}px` },
    };
  }, [text, font, fontSize, lineHeight, maxWidth, minRows, maxRows,
      padding.top, padding.right, padding.bottom, padding.left]);
}

/**
 * Measure the width of text in a single line.
 * Used by AutoInput and AutoSelect for width-based auto-sizing.
 *
 * Uses binary search with pretext layout to find the minimum width
 * that keeps the text on a single line.
 */
export function measureTextWidth(
  text: string,
  font: string,
  lineHeight: number,
): number {
  if (!text) return 0;

  const prepared = prepare(text, font);

  // Binary search for minimum single-line width
  let lo = 0;
  let hi = text.length * lineHeight * 2; // generous upper bound
  const target = 1; // we want lineCount = 1

  // First check if the text is empty-ish
  const wideResult = layout(prepared, hi, lineHeight);
  if (wideResult.lineCount <= 1) {
    // Binary search to narrow down
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      const r = layout(prepared, mid, lineHeight);
      if (r.lineCount <= target) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    return Math.ceil(hi);
  }

  // If even at huge width it's multi-line (shouldn't happen for single-line input)
  return Math.ceil(hi);
}
