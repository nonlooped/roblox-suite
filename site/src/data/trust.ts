import { catalog } from "./catalog";
import { getRepositoryVerification } from "./skill-frontmatter";

export const repoUrl = "https://github.com/nonlooped/roblox-suite";
export const skillsShUrl = "https://www.skills.sh/nonlooped/roblox-suite/roblox";

export const installCommand = "npx skills add nonlooped/roblox-suite";
export const installSingleSkill = (slug: string) =>
  `npx skills add nonlooped/roblox-suite --skill ${slug}`;

export const skillGithubUrl = (slug: string) =>
  `${repoUrl}/tree/main/${slug}/SKILL.md`;
export const skillRefsGithubUrl = (slug: string) =>
  `${repoUrl}/tree/main/${slug}/references`;
export const reportInaccuracyUrl = (slug: string) => {
  const query = new URLSearchParams({
    template: "inaccuracy.yml",
    title: `[accuracy] ${slug}: `,
    skill: slug,
  });
  return `${repoUrl}/issues/new?${query}`;
};

export async function loadFreshness() {
  const verification = await getRepositoryVerification(
    catalog.skills.map((skill) => skill.slug),
  );
  return {
    ...verification,
    policyNotes: [
      {
        date: "May 30, 2026",
        text: "Cross-experience game pass and developer product sales are disabled.",
      },
      {
        date: "July 24, 2025",
        text: "Engagement-Based Payouts were discontinued and replaced by Creator Rewards.",
      },
    ],
    ciChecks: [
      "Luau examples are formatted, linted, and statically analyzed with a pinned toolchain",
      "catalog, frontmatter, references, and deprecated-API rules are schema-validated",
      "the Astro site type-checks, builds, and passes generated-route smoke tests",
      "Markdown links and spelling are checked with pinned actions",
    ],
  };
}

export const officialSources = [
  {
    label: "Roblox Engine API Reference",
    url: "https://create.roblox.com/docs/reference/engine",
    note: "the source of truth for classes, properties, and methods",
  },
  {
    label: "Documentation index for agents",
    url: "https://create.roblox.com/docs/llms.txt",
    note: "the llms.txt index",
  },
  {
    label: "Engine API index for agents",
    url: "https://create.roblox.com/docs/reference/engine/llms.txt",
    note: "the engine llms.txt index",
  },
];
