import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

vi.mock('@chenglou/pretext', () => ({
  prepare: vi.fn((_text: string) => ({ __mock: true, text: _text })),
  layout: vi.fn((prepared: { text: string }, maxWidth: number, lineHeight: number) => {
    const charWidth = 8;
    const textWidth = prepared.text.length * charWidth;
    const lineCount = Math.max(1, Math.ceil(textWidth / Math.max(1, maxWidth)));
    return { lineCount, height: lineCount * lineHeight };
  }),
}));

const mockComputedStyle: Partial<CSSStyleDeclaration> = {
  fontSize: '14px',
  fontFamily: 'sans-serif',
  fontWeight: '400',
  lineHeight: '20px',
  paddingTop: '4px',
  paddingRight: '8px',
  paddingBottom: '4px',
  paddingLeft: '8px',
  borderTopWidth: '1px',
  borderBottomWidth: '1px',
  borderLeftWidth: '1px',
  borderRightWidth: '1px',
  boxSizing: 'border-box',
};

vi.stubGlobal('getComputedStyle', vi.fn(() => mockComputedStyle));

import { AutoInput } from '../src/components/AutoInput.js';

describe('AutoInput', () => {
  it('renders an input element', () => {
    const { container } = render(<AutoInput />);
    expect(container.querySelector('input')).not.toBeNull();
  });

  it('applies width style', () => {
    const { container } = render(<AutoInput value="hello" />);
    const input = container.querySelector('input')!;
    expect(input.style.width).toBeTruthy();
  });

  it('respects minWidth', () => {
    const { container } = render(<AutoInput value="" minWidth={100} />);
    const input = container.querySelector('input')!;
    const width = parseFloat(input.style.width);
    expect(width).toBeGreaterThanOrEqual(100);
  });

  it('calls onChange', () => {
    const handleChange = vi.fn();
    const { container } = render(<AutoInput onChange={handleChange} />);
    fireEvent.change(container.querySelector('input')!, { target: { value: 'x' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('supports forwardRef', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<AutoInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes through placeholder', () => {
    const { container } = render(<AutoInput placeholder="tag..." />);
    expect(container.querySelector('input')!.placeholder).toBe('tag...');
  });
});
