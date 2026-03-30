import React, {
  forwardRef,
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
} from 'react';
import { useAutoSize } from '../hooks/useAutoSize.js';
import { extractFontConfig, type FontConfig } from '../utils/computedStyle.js';
import { debounce } from '../utils/debounce.js';

export interface AutoTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  /** Minimum number of visible rows */
  minRows?: number;
  /** Maximum number of visible rows (scrolls beyond this) */
  maxRows?: number;
  /** Additional styles merged with computed height */
  style?: React.CSSProperties;
  /** Callback when the computed height changes */
  onHeightChange?: (height: number) => void;
}

/**
 * Auto-sizing textarea that calculates its height before render using @chenglou/pretext.
 * Drop-in replacement for <textarea> with zero layout shift.
 */
export const AutoTextarea = forwardRef<HTMLTextAreaElement, AutoTextareaProps>(
  function AutoTextarea(
    { minRows = 1, maxRows, style: userStyle, onHeightChange, onChange, value, defaultValue, ...rest },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const [fontConfig, setFontConfig] = useState<FontConfig | null>(null);
    const [contentWidth, setContentWidth] = useState(0);
    const [text, setText] = useState(() => {
      if (typeof value === 'string') return value;
      if (typeof defaultValue === 'string') return defaultValue;
      return '';
    });

    // Sync controlled value
    useEffect(() => {
      if (typeof value === 'string') {
        setText(value);
      }
    }, [value]);

    // Read computed styles on mount
    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      const readStyles = () => {
        const config = extractFontConfig(el);
        setFontConfig(config);

        // Content width = clientWidth minus horizontal padding
        // clientWidth excludes borders but includes padding
        const hPadding = config.paddingLeft + config.paddingRight;
        const clientW = el.clientWidth;
        setContentWidth(clientW - hPadding);
      };

      readStyles();

      // Observe parent for resize
      const debouncedRead = debounce(readStyles, 100);
      let observer: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(debouncedRead);
        observer.observe(el);
      }

      return () => {
        debouncedRead.cancel();
        observer?.disconnect();
      };
    }, []);

    // Calculate size via pretext
    const sizeResult = useAutoSize(
      text,
      fontConfig
        ? { font: fontConfig.font, fontSize: fontConfig.fontSize, lineHeight: fontConfig.lineHeight }
        : { font: '400 16px / 19px sans-serif', fontSize: 16, lineHeight: 19 },
      contentWidth,
      {
        minRows,
        maxRows,
        padding: fontConfig
          ? {
              top: fontConfig.paddingTop,
              right: fontConfig.paddingRight,
              bottom: fontConfig.paddingBottom,
              left: fontConfig.paddingLeft,
            }
          : undefined,
      },
    );

    // Track height changes
    const lastHeightRef = useRef<number>(0);
    useEffect(() => {
      if (sizeResult.height !== lastHeightRef.current) {
        lastHeightRef.current = sizeResult.height;
        onHeightChange?.(sizeResult.height);
      }
    }, [sizeResult.height, onHeightChange]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        onChange?.(e);
      },
      [onChange],
    );

    // Compute the final height for the textarea element.
    // For border-box, we need to add border widths to the height.
    let elementHeight = sizeResult.height;
    if (fontConfig?.boxSizing === 'border-box') {
      elementHeight += fontConfig.borderTopWidth + fontConfig.borderBottomWidth;
    }

    // If maxRows is set and we've hit the limit, enable scrolling
    const overflow =
      maxRows && sizeResult.lineCount >= maxRows ? 'auto' : 'hidden';

    const mergedStyle: React.CSSProperties = {
      ...userStyle,
      height: `${elementHeight}px`,
      overflow,
      resize: 'none',
    };

    return (
      <textarea
        ref={innerRef}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={handleChange}
        style={mergedStyle}
        {...rest}
      />
    );
  },
);
