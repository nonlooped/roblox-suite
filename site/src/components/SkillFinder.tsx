import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface Tile {
  slug: string;
  name: string;
  blurb: string;
  /** Everything the search box matches against, lowercased on the server. */
  haystack: string;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  tiles: Tile[];
}

interface Props {
  base: string;
  /* Built on the server and handed over as a prop. Importing the catalog here
     would ship all sixteen skills' sources and covers to the browser to power
     a substring match. */
  sections: Section[];
}

/**
 * The catalog, kept grouped but searchable. The grouping is what says how the
 * skills relate, so filtering hides empty groups rather than flattening
 * everything into one undifferentiated grid.
 *
 * Rendered on the server too, so the full catalog is in the HTML and the page
 * is still a usable list if hydration never happens.
 */
export function SkillFinder({ base, sections }: Props) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");

  const needle = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        tiles:
          group !== "all" && group !== section.id
            ? []
            : needle
              ? section.tiles.filter((tile) => tile.haystack.includes(needle))
              : section.tiles,
      })).filter((section) => section.tiles.length > 0),
    [needle, group, sections],
  );

  const found = visible.reduce((total, section) => total + section.tiles.length, 0);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <label className="panel-sm focus-key flex items-center gap-3 bg-paper px-4 py-3 text-ink">
          <Search className="size-4.5 shrink-0" aria-hidden="true" />
          <span className="sr-only">Search the skills</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search skills — try “save” or “NPC”"
            className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-on-paper-muted"
          />
        </label>

        {/* Group chips double as the legend for the sections below. */}
        <div className="flex flex-wrap gap-2.5">
          <Chip label="Everything" active={group === "all"} onClick={() => setGroup("all")} />
          {sections.map((section) => (
            <Chip
              key={section.id}
              label={section.title}
              active={group === section.id}
              onClick={() => setGroup(section.id)}
            />
          ))}
        </div>
      </div>

      {/* Politely announced so a screen reader hears the count change without
          the list being re-read on every keystroke. */}
      <p className="sr-only" role="status">
        {found} skills match
      </p>

      {visible.length === 0 ? (
        <div className="panel mt-8 bg-paper px-6 py-10 text-center text-on-paper">
          <p className="font-display text-heading">Nothing matches “{query}”</p>
          <p className="measure mx-auto mt-3 text-on-paper-muted">
            Try a simpler word, or browse everything.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGroup("all");
            }}
            className="panel pressable mt-6 inline-flex bg-toy-yellow px-5 py-2.5 font-display text-small font-bold text-ink focus-visible:outline-ink"
          >
            Show all skills
          </button>
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-10">
          {visible.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-heading font-bold text-toy-yellow">
                  {section.title}
                </h2>
                <p className="text-small text-on-brand-muted">{section.description}</p>
              </div>

              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.tiles.map((tile) => (
                  <li key={tile.slug} className="flex">
                    <a
                      href={`${base}/skills/${tile.slug}/`}
                      className="panel pressable group flex min-w-0 flex-1 flex-col bg-paper p-5 text-ink focus-visible:outline-ink"
                    >
                      {/* Two studs: the tile is a brick, and the mark is the
                          same one the wordmark uses. */}
                      <span className="flex gap-1.5" aria-hidden="true">
                        <span className="h-2.5 w-6 rounded-[3px] border-2 border-ink bg-toy-yellow" />
                        <span className="h-2.5 w-6 rounded-[3px] border-2 border-ink bg-brand" />
                      </span>
                      <span className="mt-4 font-display text-lead font-bold leading-tight">
                        {tile.name}
                      </span>
                      <span className="mt-2 text-small text-on-paper-muted">{tile.blurb}</span>
                      <span className="mt-4 font-mono text-[0.75rem] text-on-paper-muted">
                        {tile.slug}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "panel-sm px-3.5 py-2 font-display text-[0.8125rem] font-bold",
        active
          ? "translate-x-[3px] translate-y-[3px] bg-toy-yellow text-ink shadow-none"
          : "pressable bg-paper text-ink",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
