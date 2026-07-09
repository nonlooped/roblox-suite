import type { Group } from "./types";
import registry from "../../../skills.sh.json";

// Single source of truth: skills.sh.json (CI-validated registry groupings).
// Adding a skill to the registry is enough - site groups follow automatically.
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const groups: Group[] = registry.groupings.map((g) => ({
  id: slugify(g.title),
  title: g.title === "Agent Workflows" ? "Agent workflows" : g.title,
  description: g.description,
  skills: g.skills,
}));
