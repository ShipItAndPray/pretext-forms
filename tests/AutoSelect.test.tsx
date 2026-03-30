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
  borderTopWidth: '0px',
  borderBottomWidth: '0px',
  borderLeftWidth: '0px',
  borderRightWidth: '0px',
  boxSizing: 'content-box',
};

vi.stubGlobal('getComputedStyle', vi.fn(() => mockComputedStyle));

import { AutoSelect } from '../src/components/AutoSelect.js';

describe('AutoSelect', () => {
  it('renders a select element', () => {
    const { container } = render(
      <AutoSelect>
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </AutoSelect>,
    );
    expect(container.querySelector('select')).not.toBeNull();
  });

  it('passes through children options', () => {
    const { container } = render(
      <AutoSelect>
        <option value="x">X-Ray</option>
        <option value="y">Yankee</option>
      </AutoSelect>,
    );
    const options = container.querySelectorAll('option');
    expect(options.length).toBe(2);
  });

  it('calls onChange', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <AutoSelect onChange={handleChange}>
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </AutoSelect>,
    );
    fireEvent.change(container.querySelector('select')!, { target: { value: 'b' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('supports forwardRef', () => {
    const ref = React.createRef<HTMLSelectElement>();
    render(
      <AutoSelect ref={ref}>
        <option>Test</option>
      </AutoSelect>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});
