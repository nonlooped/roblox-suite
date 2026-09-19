import { BrickScene } from "./BrickScene";
import { CopyCommand } from "./CopyCommand";
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
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-14 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pb-20 lg:pt-16">
        {/* min-w-0 stops the install command forcing the column wider than the
            viewport, which the section's overflow would then clip. */}
        <div className="min-w-0">
          <h1 className="text-display">
            Roblox docs
            <br />
            for your
            <br />
            <span className="text-toy-yellow">coding agent</span>
          </h1>

          <p className="measure mt-6 text-lead text-on-brand-muted">
            {skillCount} skills that show your agent the right Roblox API — with the official
            docs attached.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-start">
            <a
              href={repoUrl}
              rel="noopener"
              className="panel pressable inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap bg-toy-yellow px-6 py-3.5 font-display text-base font-bold text-ink"
            >
              Star on GitHub
            </a>
            <CopyCommand command={installCommand} className="sm:max-w-md" />
          </div>

          <p className="mt-5 text-small text-on-brand-muted">
            {skillCount} skills, free and open source.
          </p>
          <ToolLogoStrip />
        </div>

        <BrickScene className="h-[260px] w-full sm:h-[360px] lg:h-[440px]" />
      </div>
    </section>
  );
}
