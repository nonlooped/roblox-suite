import { Check, Copy } from "lucide-react";
import { useCopy } from "@/lib/useCopy";

interface Props {
  command: string;
  /** Names the command for assistive technology, e.g. "for Claude Code". */
  label?: string;
  className?: string;
}

/**
 * The install command as a single pressable key. Used in the hero, on the
 * catalog, and on every skill page, so the copy affordance is in the same
 * place each time rather than being a decoration on some of them.
 */
export function CopyCommand({ command, label, className }: Props) {
  const { state, copy, fallbackRef } = useCopy(command);
  const named = label ? `${command} ${label}` : command;

  return (
    <button
      type="button"
      onClick={copy}
      className={`panel-sm group flex w-full min-w-0 items-start gap-3 bg-ink px-4 py-3 text-left font-mono text-small text-on-ink transition-colors hover:bg-ink-soft ${className ?? ""}`}
    >
      {/* Pinned to the first line: once the command wraps on a phone, a
          vertically centred prompt lands beside the second line. */}
      <span className="shrink-0 text-toy-green" aria-hidden="true">
        $
      </span>
      {/* Wraps at its spaces rather than truncating: a command cut off
          mid-argument is unrunnable, and an ellipsis hides that. */}
      <span ref={fallbackRef} className="min-w-0 flex-1 break-words">
        {command}
      </span>
      {/* Report copy state in words as well as an icon, so the feedback does
          not depend on colour. */}
      <span
        className="flex shrink-0 select-none items-center gap-1.5 self-start font-display text-[0.75rem] font-bold"
        aria-hidden="true"
      >
        {state === "copied" && (
          <>
            <Check className="size-3.5 text-toy-green" />
            <span className="text-toy-green">Copied</span>
          </>
        )}
        {state === "failed" && <span className="text-toy-yellow">Press Ctrl+C</span>}
        {state === "idle" && (
          <>
            <Copy className="size-3.5 text-on-ink-muted group-hover:text-on-ink" />
            <span className="text-on-ink-muted group-hover:text-on-ink">Copy</span>
          </>
        )}
      </span>
      <span className="sr-only" role="status">
        {state === "copied"
          ? "Install command copied"
          : state === "failed"
            ? "Copy failed. The command is selected. Press Ctrl+C to copy it."
            : `Copy install command ${named}`}
      </span>
    </button>
  );
}
