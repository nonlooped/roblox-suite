export type Group = {
  id: string;
  title: string;
  description: string;
  skills: string[];
};

export type SourceRef = {
  label: string;
  url: string;
};

export type OldVsNewRow = {
  slug: string;
  old: string;
  new: string;
  note?: string;
  current?: boolean;
};

export type Skill = {
  /** directory name — also the `--skill <slug>` install id */
  slug: string;
  /** display title (same as slug; it's the identifier users type) */
  title: string;
  hub?: boolean;
  /** README "what it covers" line — may contain `inline code` */
  oneLiner: string;
  /** 2–3 curated bullets — may contain `inline code` */
  covers: string[];
  /** real create.roblox.com source URLs from the skill's SKILL.md */
  sources: SourceRef[];
  /** SERP-friendly title for <title> and H1 — keyword-leading, ~40-55 chars */
  displayTitle: string;
  /** 2-3 sentence visible overview paragraph for the detail page.
      Substantive prose (not a list) — improves helpful-content signals
      and gives users a real intro before the bullet sections. */
  overview: string;
  /** ISO date (YYYY-MM-DD) this skill's SKILL.md was last reviewed.
      Sourced from the SKILL.md `last_reviewed` frontmatter. Drives
      datePublished/dateModified in TechArticle schema and the
      "Last reviewed" badge, so a single-skill update flows through
      without a manual trust.ts bump. */
  lastReviewed: string;
};