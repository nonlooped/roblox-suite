import type { Group } from "./types";

// Verbatim from skills.sh.json — the CI-validated grouping the suite
// publishes to the skills.sh registry.
export const groups: Group[] = [
  {
    id: "core",
    title: "Core",
    description:
      "Foundational Roblox development skills every agent should start with.",
    skills: ["roblox", "roblox-core", "roblox-networking"],
  },
  {
    id: "gameplay",
    title: "Gameplay",
    description:
      "Skills for building characters, physics, AI, world mechanics, and moving players between places.",
    skills: ["roblox-physics", "roblox-npcs", "roblox-teleport"],
  },
  {
    id: "presentation",
    title: "Presentation",
    description:
      "Skills for user interfaces, animation, visual effects, audio, and polish.",
    skills: [
      "roblox-user-interfaces",
      "roblox-animation",
      "roblox-vfx",
      "roblox-audio",
    ],
  },
  {
    id: "systems",
    title: "Systems",
    description:
      "Skills for data persistence, monetization, external automation, and live ops.",
    skills: ["roblox-datastores", "roblox-gamepasses", "roblox-open-cloud"],
  },
  {
    id: "quality",
    title: "Quality",
    description: "Skills for testing, debugging, and profiling experiences.",
    skills: ["roblox-testing"],
  },
  {
    id: "agent",
    title: "Agent workflows",
    description: "Skills for connecting AI agents directly to Roblox Studio.",
    skills: ["roblox-mcp"],
  },
];