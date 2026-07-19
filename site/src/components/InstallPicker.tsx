import { useRef, useState } from "react";
import { useCopy } from "@/lib/useCopy";

/*
 * The closing beat: the last rung of the belief ladder is "installing costs me
 * one command", so the section's job is to prove that literally rather than
 * describe it. Four agents are genuinely parallel options, which would normally
 * invite four identical cards — the banned shape. Instead they are four moulded
 * keys over one shared command panel, and the selected key sits down into its
 * own shadow. The system's press interaction becomes the selection affordance.
 */

interface Agent {
  /** The CLI's own `--agent` identifier. Verified against `skills add`. */
  id: string;
  name: string;
  /** Where the CLI actually writes the skills, confirmed per agent. */
  dir: string;
  Logo: (props: { className?: string }) => React.ReactElement;
}

/* Marks are inlined rather than fetched: nothing in this system loads from a
   CDN, and `currentColor` lets each one invert on the pressed key. */

function ClaudeCodeMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 10.5h3v3h-3v3h-1.5v3H18v-3h-1.5v3H15v-3H9v3H7.5v-3H6v3H4.5v-3H3v-3H0v-3h3v-6h18Zm-15 0h1.5v-3H6Zm10.5 0H18v-3h-1.5z" />
    </svg>
  );
}

function OpenAIMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  );
}

function CursorMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
    </svg>
  );
}

function OpenCodeMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 24H2V0h20zM17 4.8H7v14.4h10z" />
    </svg>
  );
}

/* `codex` is the CLI target for ChatGPT's coding agent; the printed command
   carries that name, so the key can stay labelled the way people say it. */
const AGENTS: Agent[] = [
  { id: "claude-code", name: "Claude Code", dir: ".claude/skills/", Logo: ClaudeCodeMark },
  { id: "codex", name: "ChatGPT", dir: ".agents/skills/", Logo: OpenAIMark },
  { id: "cursor", name: "Cursor", dir: ".agents/skills/", Logo: CursorMark },
  { id: "opencode", name: "OpenCode", dir: ".agents/skills/", Logo: OpenCodeMark },
];

interface InstallPickerProps {
  /** Base command; the agent flag is appended per selection. */
  installCommand: string;
  skillCount: number;
}

export function InstallPicker({ installCommand, skillCount }: InstallPickerProps) {
  const [active, setActive] = useState(0);
  const keyRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const agent = AGENTS[active]!;
  const command = `${installCommand} --agent ${agent.id}`;
  // Keyed on the command, so switching agents resets the confirmation rather
  // than reporting success for a line the visitor has already moved past.
  const { state, copy, fallbackRef } = useCopy(command);

  function select(index: number) {
    setActive(index);
  }

  /* Roving tabindex: arrows move between keys, matching native tab semantics. */
  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (active + delta + AGENTS.length) % AGENTS.length;
    select(next);
    keyRefs.current[next]?.focus();
  }

  return (
    <div className="mt-9">
      <div
        role="tablist"
        aria-label="Coding agents"
        onKeyDown={onKeyDown}
        className="grid grid-cols-2 gap-3.5 sm:grid-cols-4"
      >
        {AGENTS.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.id}
              ref={(node) => {
                keyRefs.current[index] = node;
              }}
              role="tab"
              id={`agent-key-${item.id}`}
              aria-selected={selected}
              aria-controls="agent-install-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              className={[
                "panel flex min-w-0 flex-col items-center gap-2.5 px-3 py-4",
                // The global focus ring is toy-yellow, which vanishes against
                // this section's yellow drench. Ink is the only ring that
                // reads on both the paper and the pressed ink key.
                "focus-visible:outline-ink",
                // The selected key travels the full 6px into its shadow and
                // stays bottomed out. A partial press reads as misalignment,
                // and an ink shadow behind an ink fill would be invisible.
                selected
                  ? "translate-x-[6px] translate-y-[6px] bg-ink text-paper shadow-none"
                  : "pressable bg-paper text-ink",
              ].join(" ")}
            >
              <item.Logo className="h-6 w-6 shrink-0" />
              <span className="font-display text-[0.8125rem] font-bold leading-tight">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="agent-install-panel"
        aria-labelledby={`agent-key-${agent.id}`}
        className="panel mt-5 bg-ink text-left"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
          {/* Pinned to the first line: once the command wraps on a phone, a
              vertically centred prompt lands beside the middle line. */}
          <span className="shrink-0 self-start font-mono text-small text-toy-green" aria-hidden="true">
            $
          </span>
          {/* Wraps at its spaces rather than scrolling: a command clipped at
              the panel edge on a phone reads as broken, not scrollable. */}
          <code
            ref={fallbackRef}
            className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-small text-on-ink"
          >
            {command}
          </code>
          {/*
            A blocked clipboard used to leave this button looking inert, with
            the visitor unable to tell whether the click landed. It now says so
            and the command is selected behind it, so the keyboard shortcut is
            still a way through. 44px tall: it is the last step before install.
          */}
          <button
            type="button"
            onClick={copy}
            className="flex min-h-11 shrink-0 items-center self-start rounded-sm px-2.5 font-display text-[0.75rem] font-bold text-on-ink transition-colors hover:bg-ink-soft"
          >
            <span aria-hidden="true">
              {state === "copied" ? "Copied" : state === "failed" ? "Press Ctrl+C" : "Copy"}
            </span>
            <span className="sr-only" role="status">
              {state === "copied"
                ? `Install command for ${agent.name} copied`
                : state === "failed"
                  ? "Copy failed. The command is selected — press Ctrl+C to copy it."
                  : `Copy install command for ${agent.name}`}
            </span>
          </button>
        </div>

        {/* The CLI's own confirmation line, so the payoff is shown not claimed.
            Mono is reserved for literal output here; the restart instruction
            lives in the section lead rather than dressed up as terminal text. */}
        <p className="border-t border-ink-soft px-4 py-3 font-mono text-[0.8125rem] text-on-ink-muted sm:px-5">
          <span className="text-toy-green" aria-hidden="true">
            ✓{" "}
          </span>
          {skillCount} skills → <span className="text-on-ink">{agent.dir}</span>
        </p>
      </div>
    </div>
  );
}
