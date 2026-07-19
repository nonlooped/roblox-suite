import { Check, Copy } from "lucide-react";
import { BrickScene } from "./BrickScene";
import { useCopy } from "@/lib/useCopy";
import { ToolLogoStrip } from "./ToolLogoStrip";

interface HeroProps {
  installCommand: string;
  repoUrl: string;
  skillCount: number;
}

/**
 * Asymmetric by construction: the argument sits left, the brick scene right.
 * Primary action is the GitHub star; the install command is the fallback for
 * visitors who are already sold.
 */
export function Hero({ installCommand, repoUrl, skillCount }: HeroProps) {
  const { state, copy, fallbackRef } = useCopy(installCommand);

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-16 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pb-24 lg:pt-16">
        {/* min-w-0 stops the nowrap install command forcing the column wider
            than the viewport, which the section's overflow would then clip. */}
        <div className="min-w-0">
          <h1 className="text-display">
            Your AI writes
            <br />
            Roblox code
            <br />
            <span className="text-toy-yellow">from 2019</span>
          </h1>

          <p className="measure mt-7 text-lead text-on-brand-muted">
            It learned from old tutorials and never got the memo. Roblox Suite teaches it what
            works today.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={repoUrl}
              rel="noopener"
              className="panel pressable inline-flex items-center justify-center gap-2.5 whitespace-nowrap bg-toy-yellow px-6 py-3.5 font-display text-base font-bold text-ink"
            >
              Star on GitHub
            </a>

            {/*
              The copy affordance used to be sr-only, so this read as a static
              code block and nothing suggested it could be clicked. The icon is
              the visible cue, and the state is carried in words as well as
              colour so the confirmation survives a colour-blind reading.
            */}
            <button
              type="button"
              onClick={copy}
              className="panel-sm group inline-flex min-w-0 items-start gap-3 bg-ink px-4 py-3 text-left font-mono text-small text-on-ink transition-colors hover:bg-ink-soft"
            >
              {/* Pinned to the first line: once the command wraps on a phone,
                  a vertically centred prompt lands beside the second line. */}
              <span className="shrink-0 text-toy-green" aria-hidden="true">
                $
              </span>
              {/* Wraps at its spaces rather than truncating: a command cut off
                  mid-argument is unrunnable, and the ellipsis hides that. */}
              <span ref={fallbackRef} className="min-w-0 flex-1 break-words">
                {installCommand}
              </span>
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
              {/* The visual label is decorative; this is what AT announces, and
                  it reports the outcome rather than just naming the action. */}
              <span className="sr-only" role="status">
                {state === "copied"
                  ? "Install command copied"
                  : state === "failed"
                    ? "Copy failed. The command is selected — press Ctrl+C to copy it."
                    : "Copy install command"}
              </span>
            </button>
          </div>

          <p className="mt-6 text-small text-on-brand-muted">{skillCount} skills, free and open source.</p>
          <ToolLogoStrip />
        </div>

        <BrickScene className="h-[300px] w-full sm:h-[380px] lg:h-[460px]" />
      </div>
    </section>
  );
}
