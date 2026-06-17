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
  featured?: boolean;
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
};