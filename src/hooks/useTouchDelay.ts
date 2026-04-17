import { useCallback, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export interface UseTouchDelayOptions {
  bypass?: boolean;
}

/**
 * Wrap a button's activation in a press-and-hold delay.
 *
 * Usage:
 *   const delayProps = useTouchDelay(() => doThing());
 *   <button {...delayProps}>...</button>
 *
 * When the user's touchDelay setting is 0 (or bypass=true), returns a plain
 * onClick handler. Otherwise returns pointer handlers that require the user
 * to hold for the configured duration before firing. Lifting early cancels.
 */
export function useTouchDelay(
  action: (() => void) | undefined,
  opts?: UseTouchDelayOptions,
) {
  const touchDelay = useSettingsStore((s) => s.touchDelay);
  const enabled = !opts?.bypass && touchDelay > 0 && typeof action === 'function';

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRef = useRef(action);
  actionRef.current = action;

  const clear = useCallback((el: HTMLElement | null) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (el) el.classList.remove('touch-holding');
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!enabled) return;
    const el = e.currentTarget as HTMLElement;
    el.classList.add('touch-holding');
    el.style.setProperty('--touch-delay-ms', `${touchDelay}ms`);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      el.classList.remove('touch-holding');
      el.classList.add('touch-complete-flash');
      setTimeout(() => el.classList.remove('touch-complete-flash'), 280);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(30); } catch { /* noop */ }
      }
      actionRef.current?.();
    }, touchDelay);
  }, [enabled, touchDelay]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!enabled) return;
    clear(e.currentTarget as HTMLElement);
  }, [enabled, clear]);

  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!enabled) return;
    clear(e.currentTarget as HTMLElement);
  }, [enabled, clear]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!enabled) {
      actionRef.current?.();
      return;
    }
    // Suppress pointer-originated clicks — the hold flow above handles those.
    // Allow keyboard Enter/Space (detail === 0) so buttons stay keyboard-usable.
    if (e.detail > 0) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    actionRef.current?.();
  }, [enabled]);

  return {
    onClick: handleClick,
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerLeave: handlePointerLeave,
    onPointerCancel: handlePointerLeave,
  };
}

export const TOUCH_DELAY_STEPS = [0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000] as const;

export function formatTouchDelay(ms: number): string {
  if (ms <= 0) return 'Off';
  if (ms === 1000) return '1 second';
  if (ms % 1000 === 0) return `${ms / 1000} seconds`;
  return `${(ms / 1000).toFixed(2).replace(/0$/, '')} seconds`;
}
