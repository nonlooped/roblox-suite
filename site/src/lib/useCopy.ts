import { useCallback, useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";

/**
 * Clipboard write with a state machine both install surfaces share.
 *
 * The clipboard API fails for reasons the visitor did not cause and cannot
 * see: a non-secure origin, a denied permission, an embedded webview, Firefox
 * without `dom.events.asyncClipboard.clipboardItem`. Swallowing that failure
 * left the button looking inert — the visitor cannot tell whether the click
 * registered, and the one thing standing between them and installing is a
 * command they now have to transcribe by hand.
 *
 * On failure the caller gets `failed` so it can say so, and `selectFallback`
 * puts the command under the visitor's own selection so Ctrl+C still works.
 */
export function useCopy(text: string) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);
  const fallbackRef = useRef<HTMLElement | null>(null);

  // A pending reset must not fire against an unmounted component, and a second
  // click has to restart the window rather than inherit the first one's.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = useCallback((next: CopyState) => {
    setState(next);
    window.clearTimeout(timer.current);
    // Failure needs longer on screen: it asks the reader to do something.
    timer.current = window.setTimeout(() => setState("idle"), next === "failed" ? 4000 : 1800);
  }, []);

  /** Select the command in place so the keyboard shortcut is still available. */
  const selectFallback = useCallback(() => {
    const node = fallbackRef.current;
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      flash("copied");
    } catch {
      selectFallback();
      flash("failed");
    }
  }, [text, flash, selectFallback]);

  // Reset when the command itself changes, so a stale "Copied" never reports
  // success for a command the visitor has since switched away from.
  useEffect(() => {
    setState("idle");
    window.clearTimeout(timer.current);
  }, [text]);

  return { state, copy, fallbackRef };
}
