import { useEffect, useRef } from 'react';

const IDLE_PAUSE_THRESHOLD_MS = 60_000; // Pause automatically if idle > 60 seconds

/**
 * Active study timer that tracks elapsed time only while the page is visible,
 * focused, and the user has been active within the last 60 seconds.
 * Automatically pauses when the tab is hidden, loses focus, or idle > 60s.
 */
export function useActiveStudyTimer(
  isEnabled: boolean,
  onTickSeconds: (deltaSeconds: number) => void
) {
  const callbackRef = useRef(onTickSeconds);
  callbackRef.current = onTickSeconds;

  useEffect(() => {
    if (!isEnabled) return;

    let isVisible = document.visibilityState === 'visible';
    let isWindowFocused = typeof document.hasFocus === 'function' ? document.hasFocus() : true;
    let lastActivityAt = Date.now();
    let accumulated = 0;

    const flush = () => {
      if (accumulated > 0) {
        callbackRef.current(accumulated);
        accumulated = 0;
      }
    };

    const markActive = () => {
      lastActivityAt = Date.now();
    };

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
      if (isVisible) {
        lastActivityAt = Date.now();
      } else {
        flush();
      }
    };

    const handleFocus = () => {
      isWindowFocused = true;
      lastActivityAt = Date.now();
    };

    const handleBlur = () => {
      isWindowFocused = false;
      flush();
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      'pointerdown',
      'keydown',
      'mousemove',
      'touchstart',
      'scroll',
    ];

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, markActive, { passive: true });
    });

    const intervalId = window.setInterval(() => {
      const idleDuration = Date.now() - lastActivityAt;
      const isActivelyStudying =
        isVisible &&
        document.visibilityState === 'visible' &&
        isWindowFocused &&
        idleDuration <= IDLE_PAUSE_THRESHOLD_MS;

      if (isActivelyStudying) {
        accumulated += 1;
        if (accumulated >= 10) {
          flush();
        }
      } else if (accumulated > 0) {
        flush();
      }
    }, 1000);

    return () => {
      flush();
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, markActive);
      });
    };
  }, [isEnabled]);
}

export function formatStudyDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const totalMinutes = Math.floor(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) {
    return safe > 0 ? '< 1 min' : '0 min';
  }
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} hr`;
  }
  return `${hours}h ${minutes}m`;
}

/** Strict Xh Ym duration format for Profile KPI cards (e.g., "0h 0m", "1h 24m"). */
export function formatStudyDurationHM(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const totalMinutes = Math.floor(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export const formatStudyDurationAr = formatStudyDuration;
