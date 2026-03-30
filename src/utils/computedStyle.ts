/**
 * Extracts font configuration from a DOM element's computed style.
 * Converts CSS values into numeric pixels for use with @chenglou/pretext.
 */

export interface FontConfig {
  /** CSS font shorthand string, e.g. "400 14px / 20px Inter, sans-serif" */
  font: string;
  fontSize: number;
  lineHeight: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  borderTopWidth: number;
  borderBottomWidth: number;
  borderLeftWidth: number;
  borderRightWidth: number;
  boxSizing: string;
}

/**
 * Parse a CSS length value to pixels.
 * Handles px, pt, em, rem units. Falls back to parseFloat for plain numbers.
 */
function parseCSSLength(value: string, fontSize: number): number {
  if (!value || value === 'auto' || value === 'none') return 0;
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  if (value.endsWith('rem')) {
    // In browser, 1rem = root font size. Default 16px.
    const rootFontSize =
      typeof document !== 'undefined'
        ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
        : 16;
    return num * rootFontSize;
  }
  if (value.endsWith('em')) return num * fontSize;
  if (value.endsWith('pt')) return num * (4 / 3);
  // px or unitless
  return num;
}

/**
 * Build a CSS font shorthand string from computed style properties.
 */
function buildFontString(
  fontWeight: string,
  fontSize: number,
  lineHeight: number,
  fontFamily: string,
): string {
  return `${fontWeight} ${fontSize}px / ${lineHeight}px ${fontFamily}`;
}

/**
 * Extract font config from a DOM element's computed styles.
 * Does NOT perform DOM measurement (no offsetHeight, scrollHeight, etc).
 * Only reads getComputedStyle values and converts them to numbers.
 */
export function extractFontConfig(element: Element): FontConfig {
  const cs = getComputedStyle(element);

  const fontSize = parseFloat(cs.fontSize) || 16;

  // line-height: "normal" => 1.2 * fontSize
  let lineHeight: number;
  if (cs.lineHeight === 'normal') {
    lineHeight = Math.round(fontSize * 1.2);
  } else {
    lineHeight = parseCSSLength(cs.lineHeight, fontSize);
  }

  const fontFamily = cs.fontFamily || 'sans-serif';
  const fontWeight = cs.fontWeight || '400';
  const font = buildFontString(fontWeight, fontSize, lineHeight, fontFamily);

  return {
    font,
    fontSize,
    lineHeight,
    paddingTop: parseCSSLength(cs.paddingTop, fontSize),
    paddingRight: parseCSSLength(cs.paddingRight, fontSize),
    paddingBottom: parseCSSLength(cs.paddingBottom, fontSize),
    paddingLeft: parseCSSLength(cs.paddingLeft, fontSize),
    borderTopWidth: parseCSSLength(cs.borderTopWidth, fontSize),
    borderBottomWidth: parseCSSLength(cs.borderBottomWidth, fontSize),
    borderLeftWidth: parseCSSLength(cs.borderLeftWidth, fontSize),
    borderRightWidth: parseCSSLength(cs.borderRightWidth, fontSize),
    boxSizing: cs.boxSizing || 'content-box',
  };
}
