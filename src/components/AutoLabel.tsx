import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import { measureTextWidth } from '../hooks/useAutoSize.js';
import { extractFontConfig, type FontConfig } from '../utils/computedStyle.js';

export interface AutoLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Additional styles merged with computed dimensions */
  style?: React.CSSProperties;
}

/**
 * Label that measures its text content and adjusts width/height.
 * Useful for animated labels that transition between sizes.
 */
export const AutoLabel = forwardRef<HTMLLabelElement, AutoLabelProps>(
  function AutoLabel({ style: userStyle, children, ...rest }, ref) {
    const innerRef = useRef<HTMLLabelElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const [fontConfig, setFontConfig] = useState<FontConfig | null>(null);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      setFontConfig(extractFontConfig(el));
    }, []);

    // Extract text content from children
    const textContent = useMemo(() => {
      if (typeof children === 'string') return children;
      if (typeof children === 'number') return String(children);
      return '';
    }, [children]);

    const computedWidth = useMemo(() => {
      if (!fontConfig || !textContent) return undefined;
      const textW = measureTextWidth(textContent, fontConfig.font, fontConfig.lineHeight);
      const hPadding = fontConfig.paddingLeft + fontConfig.paddingRight;
      return Math.ceil(textW + hPadding);
    }, [textContent, fontConfig]);

    const mergedStyle: React.CSSProperties = {
      ...userStyle,
      ...(computedWidth !== undefined ? { width: `${computedWidth}px` } : {}),
    };

    return (
      <label ref={innerRef} style={mergedStyle} {...rest}>
        {children}
      </label>
    );
  },
);
