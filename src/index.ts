// Components
export { AutoTextarea } from './components/AutoTextarea.js';
export type { AutoTextareaProps } from './components/AutoTextarea.js';

export { AutoInput } from './components/AutoInput.js';
export type { AutoInputProps } from './components/AutoInput.js';

export { AutoSelect } from './components/AutoSelect.js';
export type { AutoSelectProps } from './components/AutoSelect.js';

export { AutoLabel } from './components/AutoLabel.js';
export type { AutoLabelProps } from './components/AutoLabel.js';

// Hooks
export { useAutoSize, measureTextWidth } from './hooks/useAutoSize.js';
export type {
  AutoSizeResult,
  AutoSizeFontConfig,
  AutoSizePadding,
  AutoSizeOptions,
} from './hooks/useAutoSize.js';

// Utilities
export { extractFontConfig } from './utils/computedStyle.js';
export type { FontConfig } from './utils/computedStyle.js';
export { debounce } from './utils/debounce.js';
