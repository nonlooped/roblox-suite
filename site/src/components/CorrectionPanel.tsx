import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { corrections } from "@/data/corrections";

interface Props {
  skillsBase: string;
}

/**
 * The product's argument, staged rather than described: a real before/after on
 * a moulded panel. The reviewed status and current guidance are marked by
 * gutter symbol and label as well as colour, so the distinction survives
 * colour-blindness.
 */
export function CorrectionPanel({ skillsBase }: Props) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  /*
   * Three separate reasons to hold still, kept apart because they clear on
   * different events: `stopped` is a deliberate choice and persists until the
   * visitor undoes it (WCAG 2.2.2 wants a real control, not just a hover
   * reprieve); hover and keyboard focus are transient courtesies.
   */
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  /*
   * Announce only what the visitor asked for. An aria-live region that fires
   * every 4.2s on its own talks over whatever else a screen-reader user is
   * doing, so the region stays silent while the panel is advancing itself and
   * speaks only after a direct interaction.
   */
  const [userDriven, setUserDriven] = useState(false);
  /*
   * The first paint must be visible without JS. Motion's `initial` would
   * otherwise render the panel at opacity 0 server-side and leave it blank
   * for anyone whose hydration never runs (headless renderers, hidden tabs).
   * Only transitions between corrections animate.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paused = stopped || hovered || focused;

  useEffect(() => {
    if (reduceMotion || paused) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % corrections.length),
      4200,
    );
    return () => window.clearInterval(timer);
  }, [reduceMotion, paused]);

  function show(next: number) {
    setUserDriven(true);
    setIndex((next + corrections.length) % corrections.length);
  }

  /* Arrows move between corrections, matching native radio/tab semantics. */
  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + corrections.length) % corrections.length;
    show(next);
    dotRefs.current[next]?.focus();
  }

  const active = corrections[index]!;
  const isSwap = active.kind === "swap";

  return (
    <div
      className="panel overflow-hidden bg-ink"
      style={{ boxShadow: "8px 8px 0 var(--toy-yellow)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      <div className="flex items-center justify-between gap-4 border-b border-ink-soft px-5 py-3">
        <span className="font-mono text-[0.8125rem] text-on-ink-muted">your-agent-output.luau</span>
        <span className="font-mono text-[0.8125rem] text-on-ink-muted">
          {index + 1}/{corrections.length}
        </span>
      </div>

      <motion.div
        key={active.stale}
        initial={reduceMotion || !mounted ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="px-5 py-6 sm:px-7"
        aria-live={userDriven ? "polite" : "off"}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-toy-red px-2.5 py-0.5 font-mono text-[0.75rem] font-medium text-ink">
            {active.status}
          </span>
          <span className="text-[0.8125rem] text-on-ink-muted">what your agent wrote</span>
        </div>

        <div className="mt-3 flex items-baseline gap-3 overflow-x-auto">
          <span className="font-mono text-base text-toy-red sm:text-lead" aria-hidden="true">
            -
          </span>
          <code className="font-mono text-base text-toy-red line-through decoration-2 sm:text-lead">
            {active.stale}
          </code>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-0.5 flex-1 bg-ink-soft" />
          <ArrowRight className="size-4 rotate-90 text-on-ink-muted" aria-hidden="true" />
          <div className="h-0.5 flex-1 bg-ink-soft" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-toy-green px-2.5 py-0.5 font-mono text-[0.75rem] font-medium text-ink">
            current
          </span>
          {/*
            A swap really does substitute token-for-token; a pattern does not.
            `UpdateAsync` needs a transform callback and an audio-object graph
            is a set of instances, so calling either one "what the suite writes
            instead" would be the overclaim a Luau developer checks first.
          */}
          <span className="text-[0.8125rem] text-on-ink-muted">
            {isSwap ? "what the suite writes instead" : "the migration the suite points it to"}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-3 overflow-x-auto">
          <span className="font-mono text-base text-toy-green sm:text-lead" aria-hidden="true">
            +
          </span>
          {/* Mono is reserved for literal code. A migration target is prose,
              so it is set in the body face rather than dressed as a symbol. */}
          {isSwap ? (
            <code className="font-mono text-base font-medium text-toy-green sm:text-lead">
              {active.current}
            </code>
          ) : (
            <span className="text-base font-medium text-toy-green sm:text-lead">
              {active.current}
            </span>
          )}
        </div>

        <p className="mt-6 border-t border-ink-soft pt-4 text-small text-on-ink-muted">
          Why: {active.why}.{" "}
          <a
            href={`${skillsBase}/${active.skill}/`}
            className="text-toy-yellow underline underline-offset-4 hover:no-underline"
          >
            {active.skill}
          </a>
          {" · "}
          <a
            href={active.officialSource.url}
            aria-label={`Read ${active.officialSource.label} for ${active.stale}`}
            className="text-toy-yellow underline underline-offset-4 hover:no-underline"
          >
            Official source: {active.officialSource.label}
          </a>
        </p>
      </motion.div>

      {/*
        The dots were 8x8 hit areas on a panel that moves on its own — the two
        failures compound, because the smaller the target the more a visitor
        needs the rotation to stop. Each dot now carries a 36x44 touch area with
        the mark drawn inside it, and the stop control sits in the same row so
        the way to halt the motion is next to the thing that is moving. Six 44px
        dots plus the control overran a 390px viewport; 36 clears the 24px
        minimum with room to spare and still fits the narrowest phone.
      */}
      <div className="flex items-center gap-1 px-4 pb-3 sm:px-6">
        <button
          type="button"
          onClick={() => {
            setStopped((value) => !value);
            setUserDriven(true);
          }}
          aria-pressed={stopped}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-on-ink-muted transition-colors hover:bg-ink-soft hover:text-on-ink"
        >
          {stopped ? (
            <Play className="size-4" aria-hidden="true" />
          ) : (
            <Pause className="size-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {stopped ? "Resume cycling corrections" : "Stop cycling corrections"}
          </span>
        </button>

        <div className="flex items-center" role="group" aria-label="Corrections" onKeyDown={onKeyDown}>
          {corrections.map((item, dot) => (
            <button
              key={item.stale}
              ref={(node) => {
                dotRefs.current[dot] = node;
              }}
              type="button"
              onClick={() => show(dot)}
              aria-label={`Show the ${item.stale} correction`}
              aria-current={dot === index}
              className="group flex h-11 w-9 items-center justify-center"
            >
              <span
                className={`h-2 rounded-full transition-all duration-300 ${
                  dot === index
                    ? "w-8 bg-toy-yellow"
                    : "w-2 bg-ink-soft group-hover:bg-on-ink-muted"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
