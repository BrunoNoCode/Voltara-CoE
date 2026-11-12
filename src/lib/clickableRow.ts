import type { KeyboardEvent } from 'react';

/** Props for a clickable table row: focusable, and Enter / Space act like a click (not when typed in a cell's input or button). */
export function clickableRow(action: () => void) {
  return {
    tabIndex: 0,
    onClick: action,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      action();
    },
  };
}
