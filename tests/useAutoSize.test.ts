import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoSize, measureTextWidth } from '../src/hooks/useAutoSize.js';

// Mock @chenglou/pretext so tests don't need canvas
vi.mock('@chenglou/pretext', () => {
  return {
    prepare: vi.fn((_text: string, _font: string) => {
      // Return a mock prepared object -- layout will use _text length
      return { __mock: true, text: _text };
    }),
    layout: vi.fn((prepared: { text: string }, maxWidth: number, lineHeight: number) => {
      // Simulate: each character is ~8px wide
      const charWidth = 8;
      const textWidth = prepared.text.length * charWidth;
      const lineCount = Math.max(1, Math.ceil(textWidth / maxWidth));
      return {
        lineCount,
        height: lineCount * lineHeight,
      };
    }),
  };
});

const defaultFont = {
  font: '400 14px / 20px sans-serif',
  fontSize: 14,
  lineHeight: 20,
};

describe('useAutoSize', () => {
  it('returns correct height for single-line text', () => {
    const { result } = renderHook(() =>
      useAutoSize('hello', defaultFont, 400),
    );
    // "hello" = 5 chars * 8px = 40px, fits in 400px => 1 line => 20px
    expect(result.current.lineCount).toBe(1);
    expect(result.current.height).toBe(20);
    expect(result.current.style.height).toBe('20px');
  });

  it('returns correct height for multi-line text', () => {
    // 100 chars * 8px = 800px in 200px container => 4 lines
    const longText = 'a'.repeat(100);
    const { result } = renderHook(() =>
      useAutoSize(longText, defaultFont, 200),
    );
    expect(result.current.lineCount).toBe(4);
    expect(result.current.height).toBe(80); // 4 * 20
  });

  it('respects minRows', () => {
    const { result } = renderHook(() =>
      useAutoSize('hi', defaultFont, 400, { minRows: 3 }),
    );
    // "hi" is 1 line but minRows=3
    expect(result.current.lineCount).toBe(3);
    expect(result.current.height).toBe(60); // 3 * 20
  });

  it('respects maxRows', () => {
    const longText = 'a'.repeat(200); // 200*8=1600 in 200px => 8 lines
    const { result } = renderHook(() =>
      useAutoSize(longText, defaultFont, 200, { maxRows: 5 }),
    );
    expect(result.current.lineCount).toBe(5);
    expect(result.current.height).toBe(100); // 5 * 20
  });

  it('includes padding in height', () => {
    const { result } = renderHook(() =>
      useAutoSize('hello', defaultFont, 400, {
        padding: { top: 8, right: 12, bottom: 8, left: 12 },
      }),
    );
    // 1 line * 20 + 8 + 8 = 36
    expect(result.current.height).toBe(36);
    expect(result.current.style.height).toBe('36px');
  });

  it('handles empty text with minRows=1', () => {
    const { result } = renderHook(() =>
      useAutoSize('', defaultFont, 400),
    );
    // Empty text uses ' ' internally, 1 line
    expect(result.current.lineCount).toBe(1);
    expect(result.current.height).toBe(20);
  });

  it('handles zero maxWidth gracefully', () => {
    const { result } = renderHook(() =>
      useAutoSize('hello', defaultFont, 0, { minRows: 2 }),
    );
    // Falls back to minRows
    expect(result.current.lineCount).toBe(2);
    expect(result.current.height).toBe(40);
  });

  it('handles very long text', () => {
    const veryLong = 'a'.repeat(10000); // 80000px in 400px => 200 lines
    const { result } = renderHook(() =>
      useAutoSize(veryLong, defaultFont, 400),
    );
    expect(result.current.lineCount).toBe(200);
    expect(result.current.height).toBe(4000);
  });

  it('clamps between minRows and maxRows', () => {
    const text = 'a'.repeat(25); // 200px in 400px => 1 line, but minRows=3
    const { result } = renderHook(() =>
      useAutoSize(text, defaultFont, 400, { minRows: 3, maxRows: 5 }),
    );
    expect(result.current.lineCount).toBe(3);
  });

  it('memoizes result when inputs unchanged', () => {
    const { result, rerender } = renderHook(() =>
      useAutoSize('hello', defaultFont, 400),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe('measureTextWidth', () => {
  it('returns 0 for empty string', () => {
    expect(measureTextWidth('', '400 14px sans-serif', 20)).toBe(0);
  });

  it('returns a positive width for non-empty text', () => {
    const w = measureTextWidth('hello world', '400 14px sans-serif', 20);
    expect(w).toBeGreaterThan(0);
  });

  it('longer text produces wider measurement', () => {
    const short = measureTextWidth('hi', '400 14px sans-serif', 20);
    const long = measureTextWidth('hello world this is longer', '400 14px sans-serif', 20);
    expect(long).toBeGreaterThan(short);
  });
});
