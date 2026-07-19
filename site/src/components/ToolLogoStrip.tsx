import type { ComponentType, SVGProps } from "react";

type MarkProps = SVGProps<SVGSVGElement>;
type Mark = ComponentType<MarkProps>;

function ClaudeMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21 10.5h3v3h-3v3h-1.5v3H18v-3h-1.5v3H15v-3H9v3H7.5v-3H6v3H4.5v-3H3v-3H0v-3h3v-6h18Zm-15 0h1.5v-3H6Zm10.5 0H18v-3h-1.5z" />
    </svg>
  );
}

function OpenAIMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22.28 9.82a5.98 5.98 0 0 0-.51-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .75 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A6.06 6.06 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07Zm-9.02 12.61a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.79.79 0 0 0 .39-.68v-6.74l2.02 1.17a.08.08 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5ZM3.6 18.3a4.47 4.47 0 0 1-.53-3.01l.14.08 4.78 2.76a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06l-4.83 2.79A4.5 4.5 0 0 1 3.6 18.3ZM2.34 7.9a4.49 4.49 0 0 1 2.37-1.97v5.68a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79a4.5 4.5 0 0 1-1.65-6.12Zm16.6 3.85-5.83-3.39L15.12 7.2a.08.08 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.68a.79.79 0 0 0-.41-.67Zm2.01-3.02-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66ZM8.31 12.86l-2.02-1.16a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08-4.8 2.76a.79.79 0 0 0-.39.68Z" />
    </svg>
  );
}

function CursorMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="m11.5.13-9.61 5.55a.84.84 0 0 0-.42.73v11.19c0 .3.16.57.42.72l9.61 5.55a1 1 0 0 0 1 0l9.61-5.55a.84.84 0 0 0 .42-.72V6.4a.84.84 0 0 0-.42-.72L12.5.13a1 1 0 0 0-1 0ZM2.66 6.34h18.55c.26 0 .43.28.3.51L12.23 22.92c-.06.11-.23.06-.23-.06V12.34a.59.59 0 0 0-.3-.51L2.6 6.57c-.11-.06-.06-.23.06-.23Z" />
    </svg>
  );
}

function CopilotMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8.3 3.2A4.2 4.2 0 0 1 12 1a4.2 4.2 0 0 1 3.7 2.2A5.7 5.7 0 0 1 22 8.7v6.6a5.7 5.7 0 0 1-6.3 5.5A4.2 4.2 0 0 1 12 23a4.2 4.2 0 0 1-3.7-2.2A5.7 5.7 0 0 1 2 15.3V8.7a5.7 5.7 0 0 1 6.3-5.5Zm.4 3.1a3.1 3.1 0 0 0-3.8 3v6a3.1 3.1 0 0 0 3.8 3V6.3Zm6.6 0v12a3.1 3.1 0 0 0 3.8-3v-6a3.1 3.1 0 0 0-3.8-3ZM12 4.1a2.1 2.1 0 0 0-2.1 2.1v11.6a2.1 2.1 0 0 0 4.2 0V6.2A2.1 2.1 0 0 0 12 4.1Z" />
    </svg>
  );
}

function WindsurfMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M3 5.5c3.8 0 5.8 1.8 7.4 3.3C12 10.3 13 11 15.2 11c2.1 0 3.6-.9 5.8-3.2l-1.5 5.4c-1.3 1.1-2.8 1.6-4.5 1.6-3.2 0-5-1.6-6.6-3.1C7 10.3 6 9.5 3 9.5Zm0 7c3.8 0 5.8 1.8 7.4 3.3 1.6 1.5 2.6 2.2 4.8 2.2 2.1 0 3.6-.9 5.8-3.2l-1.5 5.4c-1.3 1.1-2.8 1.6-4.5 1.6-3.2 0-5-1.6-6.6-3.1C7 17.3 6 16.5 3 16.5Z" />
    </svg>
  );
}

function GeminiMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 1c.8 5.4 2.6 8.8 7.2 11-4.6 2.2-6.4 5.6-7.2 11-.8-5.4-2.6-8.8-7.2-11C9.4 9.8 11.2 6.4 12 1Z" />
    </svg>
  );
}

function ClineMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M17.5 5.5a8.5 8.5 0 1 0 0 13M6 12h11" />
    </svg>
  );
}

function OpenCodeMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 24H2V0h20zM17 4.8H7v14.4h10z" />
    </svg>
  );
}


interface Tool {
  name: string;
  Mark: Mark;
}

/*
 * A sample, not a compatibility matrix.
 *
 * The Skills CLI installs to far more clients than this, and the repository
 * README deliberately refuses to publish a hardcoded list — it points at the
 * CLI's own options page instead, because the list moves. Fifteen marks in the
 * hero read as an exhaustive roster, which is both a claim this page cannot
 * back and a wall of logos competing with the headline. Eight recognisable
 * names carry the "it works with what you already use" point, and the line
 * underneath does the honest work the logos cannot: says there are more.
 *
 * The first four are the ones InstallPicker offers by verified `--agent` id.
 */
const TOOLS: Tool[] = [
  { name: "Claude Code", Mark: ClaudeMark },
  { name: "Codex", Mark: OpenAIMark },
  { name: "Cursor", Mark: CursorMark },
  { name: "OpenCode", Mark: OpenCodeMark },
  { name: "GitHub Copilot", Mark: CopilotMark },
  { name: "Windsurf", Mark: WindsurfMark },
  { name: "Gemini", Mark: GeminiMark },
  { name: "Cline", Mark: ClineMark },
];

export function ToolLogoStrip() {
  return (
    <div className="mt-5">
      {/*
        No hover state on the chips: they are labels, not controls, and a
        colour change on something unclickable promises an interaction that
        never arrives. The visible name is also the accessible name, so the
        mark beside it stays aria-hidden rather than announcing twice.
      */}
      <ul
        aria-label="Coding agents Roblox Suite works with"
        className="flex max-w-xl flex-wrap gap-2"
      >
        {TOOLS.map(({ name, Mark }) => (
          <li key={name} className="panel-sm flex h-9 items-center gap-2 bg-paper px-2.5 text-ink">
            <Mark className="size-4 shrink-0" aria-hidden="true" />
            <span className="font-display text-[0.6875rem] font-bold leading-none">{name}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-small text-on-brand-muted">
        …and any other agent the Skills CLI installs to.
      </p>
    </div>
  );
}
