import { useEffect, useRef } from 'react';

/**
 * Active study timer that tracks elapsed time only while the page is visible and focused.
 * Automatically pauses when the browser tab is hidden or loses focus via visibilitychange.
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
    let accumulated = 0;

    const flush = () => {
      if (accumulated > 0) {
        callbackRef.current(accumulated);
        accumulated = 0;
      }
    };

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
      if (!isVisible) {
        flush();
      }
    };

    const handleBlur = () => {
      flush();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    const intervalId = window.setInterval(() => {
      if (isVisible && document.visibilityState === 'visible') {
        accumulated += 1;
        if (accumulated >= 10) {
          flush();
        }
      }
    }, 1000);

    return () => {
      flush();
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isEnabled]);
}

export function formatStudyDuration(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) {
    return totalSeconds > 0 ? '< 1 min' : '0 min';
  }
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} hr`;
  }
  return `${hours}h ${minutes}m`;
}

export const formatStudyDurationAr = formatStudyDuration;
