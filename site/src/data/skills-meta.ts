import { catalog } from "./catalog";
import { getVerificationForSlugs } from "./skill-frontmatter";
import type { Skill, SkillSummary } from "./types";

const rawSkills = catalog.skills.map((skill) => ({
  slug: skill.slug,
  title: skill.title,
  hub: skill.hub,
  oneLiner: skill.oneLiner,
  covers: skill.covers,
  sources: skill.sources.map((source) => ({
    label: source.label,
    url: source.url,
    verifiedAt: source.verified_at,
  })),
  displayTitle: skill.displayTitle,
  overview: skill.overview,
  risk: skill.risk,
  createdAt: skill.created_at,
  lastChangedAt: skill.last_changed_at,
  exampleStatus: skill.examples.status,
}));

let skillsPromise: Promise<Skill[]> | undefined;

export function loadSkills() {
  skillsPromise ??= (async () => {
    const verification = await getVerificationForSlugs(rawSkills.map((skill) => skill.slug));
    return rawSkills.map((skill) => {
      const metrics = verification[skill.slug];
      return {
        ...skill,
        oldestVerifiedAt: metrics.oldestVerifiedAt,
        newestVerifiedAt: metrics.newestVerifiedAt,
        verificationCoverage: metrics.verificationCoverage,
        verifiedFiles: metrics.verifiedFiles,
        totalFiles: metrics.totalFiles,
      };
    });
  })();
  return skillsPromise;
}

// Route/group consumers only need catalog fields. Verification fields are
// populated by loadSkills() before a trust badge or schema is rendered.
export const skills: SkillSummary[] = rawSkills;
export const skillCount = skills.length;
export const skillsBySlug = new Map(skills.map((skill) => [skill.slug, skill]));

let bySlugPromise: Promise<Map<string, Skill>> | undefined;
export function loadSkillsBySlug() {
  bySlugPromise ??= loadSkills().then(
    (list) => new Map(list.map((skill) => [skill.slug, skill])),
  );
  return bySlugPromise;
}

export function skillsForGroup(skillSlugs: string[]) {
  return skillSlugs
    .map((slug) => skillsBySlug.get(slug))
    .filter((skill): skill is SkillSummary => Boolean(skill));
}
