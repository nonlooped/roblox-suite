export type Group = {
  id: string;
  title: string;
  description: string;
  skills: string[];
};

export type SourceRef = {
  label: string;
  url: string;
  verifiedAt: string;
};

export type OldVsNewRow = {
  slug: string;
  old: string;
  new: string;
  note?: string;
  current?: boolean;
};

export type RiskTier = "critical" | "medium" | "lower";
export type ExampleStatus = "none" | "experimental" | "reviewed" | "tested";

export type SkillSummary = {
  slug: string;
  title: string;
  hub?: boolean;
  oneLiner: string;
  covers: string[];
  sources: SourceRef[];
  displayTitle: string;
  overview: string;
  risk: RiskTier;
  createdAt: string;
  lastChangedAt: string;
  exampleStatus: ExampleStatus;
};

export type Skill = SkillSummary & {
  oldestVerifiedAt: string;
  newestVerifiedAt: string;
  verificationCoverage: number;
  verifiedFiles: number;
  totalFiles: number;
};
