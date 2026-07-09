// Site-wide constants + the "show trust, don't assert it" evidence.
// Every value here is sourced from the repo, not invented.

export const repoUrl = "https://github.com/nonlooped/roblox-suite";
export const skillsShUrl = "https://www.skills.sh/nonlooped/roblox-suite/roblox";

export const installCommand = "npx skills add nonlooped/roblox-suite";
export const installSingleSkill = (slug: string) =>
  `npx skills add nonlooped/roblox-suite --skill ${slug}`;

export const skillGithubUrl = (slug: string) =>
  `${repoUrl}/tree/main/${slug}/SKILL.md`;
export const skillRefsGithubUrl = (slug: string) =>
  `${repoUrl}/tree/main/${slug}/references`;

export const freshness = {
  // Every reference file in the repo carries this frontmatter date.
  lastReviewed: "2026-06-17",
  referenceCount: 48,
  policyNotes: [
    {
      date: "May 30, 2026",
      text: "Cross-experience game pass and developer product sales are disabled.",
    },
    {
      date: "July 24, 2025",
      text: "Engagement-Based Payouts (Premium Payouts) were discontinued and replaced by Creator Rewards.",
    },
  ],
  // From .github/workflows/validate.yml - accuracy is enforced, not asserted.
  ciChecks: [
    "lychee link-checks every Markdown file so broken docs links fail the build",
    "ajv validates skills.sh.json against the official skills.sh schema",
    "typos spell-checks the whole repo",
  ],
};

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