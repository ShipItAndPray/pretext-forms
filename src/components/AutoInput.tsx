import React, {
  forwardRef,
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import { measureTextWidth } from '../hooks/useAutoSize.js';
import { extractFontConfig, type FontConfig } from '../utils/computedStyle.js';

export interface AutoInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  /** Additional styles merged with computed width */
  style?: React.CSSProperties;
  /** Minimum width in px */
  minWidth?: number;
  /** Maximum width in px */
  maxWidth?: number;
}

/** Buffer in px to prevent text touching the right edge */
const WIDTH_BUFFER = 8;

/**
 * Auto-sizing input that adjusts its width to fit the content.
 * Uses @chenglou/pretext for pre-render text measurement.
 */
export const AutoInput = forwardRef<HTMLInputElement, AutoInputProps>(
  function AutoInput(
    { style: userStyle, minWidth = 40, maxWidth = Infinity, onChange, value, defaultValue, placeholder, ...rest },
    ref,
  ) {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const [fontConfig, setFontConfig] = useState<FontConfig | null>(null);
    const [text, setText] = useState(() => {
      if (typeof value === 'string') return value;
      if (typeof defaultValue === 'string') return defaultValue;
      return '';
    });

    useEffect(() => {
      if (typeof value === 'string') setText(value);
    }, [value]);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      setFontConfig(extractFontConfig(el));
    }, []);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
        onChange?.(e);
      },
      [onChange],
    );

    const computedWidth = useMemo(() => {
      if (!fontConfig) return minWidth;

      const font = fontConfig.font;
      const lh = fontConfig.lineHeight;

      // Measure the current text
      const textW = text ? measureTextWidth(text, font, lh) : 0;

      // Measure placeholder as minimum width
      const placeholderW = placeholder
        ? measureTextWidth(placeholder, font, lh)
        : 0;

      const contentW = Math.max(textW, placeholderW) + WIDTH_BUFFER;
      const hPadding = fontConfig.paddingLeft + fontConfig.paddingRight;
      const hBorder = fontConfig.borderLeftWidth + fontConfig.borderRightWidth;

      let totalW = contentW + hPadding + hBorder;
      totalW = Math.max(minWidth, Math.min(maxWidth, totalW));

      return totalW;
    }, [text, fontConfig, placeholder, minWidth, maxWidth]);

    const mergedStyle: React.CSSProperties = {
      ...userStyle,
      width: `${computedWidth}px`,
    };

    return (
      <input
        ref={innerRef}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        placeholder={placeholder}
        onChange={handleChange}
        style={mergedStyle}
        {...rest}
      />
    );
  },
);
