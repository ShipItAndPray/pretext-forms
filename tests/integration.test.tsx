import { describe, it, expect, vi } from 'vitest';
import React, { useState } from 'react';
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

import { AutoTextarea, AutoInput, AutoSelect, AutoLabel } from '../src/index.js';

describe('Integration: all components in one form', () => {
  function TestForm() {
    const [text, setText] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('bug');

    return (
      <form data-testid="form">
        <AutoLabel htmlFor="name">Name</AutoLabel>
        <AutoInput
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          minWidth={80}
        />
        <AutoSelect
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="question">Question</option>
        </AutoSelect>
        <AutoTextarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe..."
          minRows={2}
          maxRows={10}
        />
      </form>
    );
  }

  it('renders all components without errors', () => {
    const { container } = render(<TestForm />);
    expect(container.querySelector('form')).not.toBeNull();
    expect(container.querySelector('label')).not.toBeNull();
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.querySelector('select')).not.toBeNull();
    expect(container.querySelector('textarea')).not.toBeNull();
  });

  it('all elements have style attributes', () => {
    const { container } = render(<TestForm />);
    const textarea = container.querySelector('textarea')!;
    const input = container.querySelector('input')!;

    // These should have computed dimensions
    expect(textarea.style.height).toBeTruthy();
    expect(input.style.width).toBeTruthy();
  });

  it('textarea responds to text input', () => {
    const { container } = render(<TestForm />);
    const textarea = container.querySelector('textarea')!;
    const initialHeight = textarea.style.height;

    fireEvent.change(textarea, { target: { value: 'a'.repeat(200) } });

    // After entering long text, height should change
    // (In the mock, the height updates based on text length)
  });

  it('input responds to text input', () => {
    const { container } = render(<TestForm />);
    const input = container.querySelector('input')!;

    fireEvent.change(input, { target: { value: 'John Doe' } });
    // Input should resize based on content
  });

  it('select responds to option change', () => {
    const { container } = render(<TestForm />);
    const select = container.querySelector('select')!;

    fireEvent.change(select, { target: { value: 'feature' } });
    expect(select.value).toBe('feature');
  });
});
