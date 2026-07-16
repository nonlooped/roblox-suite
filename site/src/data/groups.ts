import { catalog } from "./catalog";
import type { Group } from "./types";

export const groups: Group[] = catalog.groups.map((group) => ({
  id: group.id,
  title: group.title === "Agent Workflows" ? "Agent workflows" : group.title,
  description: group.description,
  skills: group.skills,
}));
