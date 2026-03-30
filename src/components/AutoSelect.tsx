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

export interface AutoSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Additional styles merged with computed width */
  style?: React.CSSProperties;
}

/** Width reserved for the dropdown arrow, in px */
const ARROW_WIDTH = 24;

/**
 * Auto-sizing select that adjusts its width to fit the selected option text.
 * Uses @chenglou/pretext for pre-render text measurement.
 */
export const AutoSelect = forwardRef<HTMLSelectElement, AutoSelectProps>(
  function AutoSelect({ style: userStyle, onChange, children, value, defaultValue, ...rest }, ref) {
    const innerRef = useRef<HTMLSelectElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const [fontConfig, setFontConfig] = useState<FontConfig | null>(null);
    const [selectedText, setSelectedText] = useState('');

    // Read selected option text
    const readSelectedText = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      const option = el.options[el.selectedIndex];
      setSelectedText(option?.text ?? '');
    }, []);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      setFontConfig(extractFontConfig(el));
      readSelectedText();
    }, [readSelectedText]);

    // Re-read when value prop changes
    useEffect(() => {
      readSelectedText();
    }, [value, readSelectedText]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedText(e.target.options[e.target.selectedIndex]?.text ?? '');
        onChange?.(e);
      },
      [onChange],
    );

    const computedWidth = useMemo(() => {
      if (!fontConfig || !selectedText) return undefined;

      const textW = measureTextWidth(selectedText, fontConfig.font, fontConfig.lineHeight);
      const hPadding = fontConfig.paddingLeft + fontConfig.paddingRight;
      const hBorder = fontConfig.borderLeftWidth + fontConfig.borderRightWidth;

      return Math.ceil(textW + ARROW_WIDTH + hPadding + hBorder);
    }, [selectedText, fontConfig]);

    const mergedStyle: React.CSSProperties = {
      ...userStyle,
      ...(computedWidth !== undefined ? { width: `${computedWidth}px` } : {}),
    };

    return (
      <select
        ref={innerRef}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        style={mergedStyle}
        {...rest}
      >
        {children}
      </select>
    );
  },
);
