# @shipitandpray/pretext-forms

Auto-sizing form fields that know their height before render. Zero CLS. Zero flash.

Built on [@chenglou/pretext](https://github.com/chenglou/pretext) -- a pure JavaScript text measurement and layout engine. No hidden divs, no `scrollHeight` hacks, no post-render reflow.

## Install

```bash
npm install @shipitandpray/pretext-forms @chenglou/pretext
```

## Quick Start

```tsx
import { AutoTextarea } from '@shipitandpray/pretext-forms';

function ChatInput() {
  const [text, setText] = useState('');
  return (
    <AutoTextarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Type a message..."
      minRows={1}
      maxRows={8}
    />
  );
}
```

That's it. The textarea calculates its exact height before the browser paints. No flash, no reflow.

## Components

### `<AutoTextarea />`

Drop-in replacement for `<textarea>` with auto-height.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minRows` | `number` | `1` | Minimum visible rows |
| `maxRows` | `number` | `Infinity` | Maximum rows before scrolling |
| `onHeightChange` | `(height: number) => void` | -- | Called when computed height changes |
| `style` | `React.CSSProperties` | -- | Merged with computed height |
| ...rest | `TextareaHTMLAttributes` | -- | All standard textarea props |

```tsx
<AutoTextarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  minRows={2}
  maxRows={10}
  onHeightChange={(h) => console.log('height:', h)}
  className="my-textarea"
/>
```

### `<AutoInput />`

Auto-width input that grows with its content.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minWidth` | `number` | `40` | Minimum width in px |
| `maxWidth` | `number` | `Infinity` | Maximum width in px |
| `style` | `React.CSSProperties` | -- | Merged with computed width |
| ...rest | `InputHTMLAttributes` | -- | All standard input props |

```tsx
<AutoInput
  placeholder="Add tag..."
  minWidth={80}
  maxWidth={300}
/>
```

### `<AutoSelect />`

Select that auto-sizes to fit the selected option text.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | `React.CSSProperties` | -- | Merged with computed width |
| ...rest | `SelectHTMLAttributes` | -- | All standard select props |

```tsx
<AutoSelect value={val} onChange={(e) => setVal(e.target.value)}>
  <option value="sm">Small</option>
  <option value="lg">A Much Longer Option</option>
</AutoSelect>
```

### `<AutoLabel />`

Label that measures its text content for width transitions.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | `React.CSSProperties` | -- | Merged with computed width |
| ...rest | `LabelHTMLAttributes` | -- | All standard label props |

## Hook: `useAutoSize`

For custom components that need pre-render text measurement.

```tsx
import { useAutoSize } from '@shipitandpray/pretext-forms';

function CustomField({ text }) {
  const { height, lineCount, style } = useAutoSize(
    text,
    { font: '400 14px / 20px Inter', fontSize: 14, lineHeight: 20 },
    400, // maxWidth
    { minRows: 2, maxRows: 10, padding: { top: 8, right: 12, bottom: 8, left: 12 } },
  );
  return <div style={{ ...style, overflow: 'auto' }}>{text}</div>;
}
```

### `useAutoSize` Return Value

```ts
interface AutoSizeResult {
  height: number;        // Total height including padding
  width: number;         // Measured width
  lineCount: number;     // Number of wrapped lines
  style: {               // Ready-to-spread style object
    height: string;
    width?: string;
  };
}
```

## Utility: `measureTextWidth`

Measures the width of single-line text using pretext layout.

```ts
import { measureTextWidth } from '@shipitandpray/pretext-forms';

const width = measureTextWidth('hello world', '400 14px Inter', 20);
```

## How It Works

1. Reads the element's computed font styles on mount (font-family, font-size, line-height, etc.)
2. On every value change, passes the text + font config to `@chenglou/pretext`'s `prepare()` + `layout()`
3. Gets back exact `lineCount` and `height` -- calculated in pure JS with no DOM measurement
4. Sets the element's `style.height` in the same render, before the browser paints
5. Result: correct dimensions on first paint, zero layout shift

## Comparison

| Feature | pretext-forms | react-textarea-autosize | CSS field-sizing |
|---------|--------------|------------------------|-----------------|
| Zero reflow | Yes | No (1 frame) | Yes |
| Safari support | Yes | Yes | No |
| Firefox support | Yes | Yes | No |
| Input auto-width | Yes | No | Partial |
| Select auto-width | Yes | No | Yes |
| SSR compatible | Yes | No (needs DOM) | Yes |
| Bundle size | ~8KB | ~4KB | 0KB |

## Browser Support

Chrome 90+, Firefox 90+, Safari 14+, Edge 90+.

All browsers that support `Intl.Segmenter` and `OffscreenCanvas` (or fallback to `<canvas>`).

## Development

```bash
npm install
npm run dev          # Watch mode build
npm test             # Run tests
npm run demo         # Interactive demo
npm run build        # Production build (ESM + CJS)
```

## License

MIT
