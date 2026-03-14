export type DeployStatus = "READY" | "BUILDING" | "ERROR" | null;

export type Project = {
  name: string;
  languages: string[];
  lastCommit: string;
  lastCommitAgo: string;
  deployStatus: DeployStatus;
  deployUrl: string | null;
};

