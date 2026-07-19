/**
 * Concrete API corrections the suite makes. Every row traces to a claim in the
 * named SKILL.md — never add a row the skill files do not support.
 */
export interface Correction {
  stale: string;
  current: string;
  /**
   * Whether `current` is a literal replacement or a migration target.
   *
   * `swap` substitutes token-for-token in real Luau. `pattern` does not:
   * `UpdateAsync` takes a transform callback `SetAsync` has no equivalent of,
   * and "audio-object graph" is a set of instances rather than a symbol. The
   * panel labels the two differently — presenting a pattern as a drop-in diff
   * is the first thing a working Luau developer would catch, and it would cost
   * more trust than the tighter copy is worth.
   */
  kind: "swap" | "pattern";
  /** Reviewed API status; do not infer a deprecation from a replacement. */
  status:
    | "deprecated"
    | "unsafe when servers write the same key"
    | "not recommended for client teleports"
    | "discouraged for new work";
  /** Plain-language consequence. Short enough to scan, not a paragraph. */
  why: string;
  skill: string;
  officialSource: {
    label: string;
    url: string;
  };
}

export const corrections: Correction[] = [
  {
    stale: "Humanoid:LoadAnimation",
    kind: "swap",
    current: "Animator:LoadAnimation",
    status: "deprecated",
    why: "A deprecated animation-loading method",
    skill: "roblox-animation",
    officialSource: {
      label: "Roblox Creator Hub: Humanoid",
      url: "https://create.roblox.com/docs/reference/engine/classes/Humanoid#LoadAnimation",
    },
  },
  {
    stale: "BodyVelocity",
    kind: "swap",
    current: "LinearVelocity",
    status: "deprecated",
    why: "A deprecated mover instead of a velocity constraint",
    skill: "roblox-physics",
    officialSource: {
      label: "Roblox Creator Hub: BodyVelocity",
      url: "https://create.roblox.com/docs/reference/engine/classes/BodyVelocity",
    },
  },
  {
    stale: "SetAsync",
    kind: "pattern",
    current: "UpdateAsync",
    status: "unsafe when servers write the same key",
    why: "Data inconsistency when two servers set the same key",
    skill: "roblox-datastores",
    officialSource: {
      label: "Roblox Creator Hub: Data stores",
      url: "https://create.roblox.com/docs/cloud-services/data-stores#set-vs-update",
    },
  },
  {
    stale: "client-side TeleportService:Teleport",
    kind: "pattern",
    current: "server-side TeleportService:TeleportAsync",
    status: "not recommended for client teleports",
    why: "A client teleport path Roblox does not recommend",
    skill: "roblox-teleport",
    officialSource: {
      label: "Roblox Creator Hub: Teleport between places",
      url: "https://create.roblox.com/docs/projects/teleport#teleport-players",
    },
  },
  {
    stale: "BodyGyro",
    kind: "swap",
    current: "AlignOrientation",
    status: "deprecated",
    why: "A deprecated mover instead of an orientation constraint",
    skill: "roblox-physics",
    officialSource: {
      label: "Roblox Creator Hub: BodyGyro",
      url: "https://create.roblox.com/docs/reference/engine/classes/BodyGyro",
    },
  },
  {
    stale: "Sound",
    kind: "pattern",
    current: "audio-object graph",
    status: "discouraged for new work",
    why: "New audio work misses the recommended audio-object graph",
    skill: "roblox-audio",
    officialSource: {
      label: "Roblox Creator Hub: Audio objects",
      url: "https://create.roblox.com/docs/audio/objects",
    },
  },
];
