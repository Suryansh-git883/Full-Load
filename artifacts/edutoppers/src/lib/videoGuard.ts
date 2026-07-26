import { useEffect, useRef } from "react";

const PLAYER_LOAD_TIMEOUT_MS = 20_000;

/** Leave the player route without preserving it as the next history target. */
export function redirectToHome() {
  if (window.location.pathname !== "/") {
    window.location.replace("/");
  }
}

/**
 * Guards third-party player iframes. Cross-origin iframe internals cannot be
 * inspected, so we handle the browser-visible failure signals: iframe errors
 * and players that never finish their initial load.
 */
export function useVideoLoadGuard() {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => {
      redirectToHome();
    }, PLAYER_LOAD_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleError = () => {
    redirectToHome();
  };

  return { handleLoad, handleError };
}