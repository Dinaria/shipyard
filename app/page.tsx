import Header from "../components/Header";
import ProjectCard from "../components/ProjectCard";
import type { Project, DeployStatus } from "../types";

// ---------- GitHub types & fetching ----------

type GithubProject = {
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  lastCommit: { message: string; date: string; author: string } | null;
  commitActivity: number[];
  updatedAt: string;
  stars: number;
};

type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  owner: { login: string };
  updated_at: string;
  stargazers_count: number;
};

type GitHubCommit = {
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
};

type GitHubCommitActivityWeek = {
  days: number[];
};

const GITHUB_API_BASE = "https://api.github.com";

async function fetchLatestCommit(
  owner: string,
  repo: string,
): Promise<GithubProject["lastCommit"]> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${encodeURIComponent(
        owner,
      )}/${encodeURIComponent(repo)}/commits?per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "shipyard-dashboard",
        },
        // Let Next.js cache via fetch caching / route caching if desired.
      },
    );

    if (!res.ok) {
      return null;
    }

    const commits = (await res.json()) as GitHubCommit[];
    const latest = commits[0];

    if (!latest) {
      return null;
    }

    return {
      message: latest.commit.message,
      date: latest.commit.author.date,
      author: latest.commit.author.name,
    };
  } catch {
    return null;
  }
}

async function fetchCommitActivity(
  owner: string,
  repo: string,
): Promise<number[]> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${encodeURIComponent(
        owner,
      )}/${encodeURIComponent(repo)}/stats/commit_activity`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "shipyard-dashboard",
        },
      },
    );

    if (!res.ok) {
      return [];
    }

    const weeks = (await res.json()) as GitHubCommitActivityWeek[];

    if (!Array.isArray(weeks) || weeks.length === 0) {
      return [];
    }

    const allDays = weeks.flatMap((week) => week.days ?? []);
    const last30Days = allDays.slice(-30);

    return last30Days;
  } catch {
    return [];
  }
}

async function fetchGithubProjects(): Promise<GithubProject[]> {
  const username = process.env.GITHUB_USERNAME;

  if (!username) {
    return [];
  }

  try {
    const reposRes = await fetch(
      `${GITHUB_API_BASE}/users/${encodeURIComponent(
        username,
      )}/repos?sort=updated&per_page=12`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "shipyard-dashboard",
        },
      },
    );

    if (!reposRes.ok) {
      return [];
    }

    const repos = (await reposRes.json()) as GitHubRepo[];

    const projects: GithubProject[] = await Promise.all(
      repos.map(async (repo) => {
        const owner = repo.owner?.login ?? username;
        const repoName = repo.name;

        const [lastCommit, commitActivity] = await Promise.all([
          fetchLatestCommit(owner, repoName),
          fetchCommitActivity(owner, repoName),
        ]);

        return {
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          lastCommit,
          commitActivity,
          updatedAt: repo.updated_at,
          stars: repo.stargazers_count,
        };
      }),
    );

    return projects;
  } catch {
    return [];
  }
}

// ---------- Vercel types & fetching ----------

type VercelDeploymentStatus =
  | "READY"
  | "BUILDING"
  | "ERROR"
  | "QUEUED"
  | "CANCELED";

type VercelDeployment = {
  name: string;
  status: VercelDeploymentStatus;
  url: string | null;
  createdAt: string;
};

type RawVercelDeployment = {
  name: string;
  url?: string;
  createdAt: number | string;
  readyState: VercelDeploymentStatus | string;
};

type VercelDeploymentMap = Record<string, VercelDeployment>;

const VERCEL_API_BASE = "https://api.vercel.com";

function normalizeCreatedAt(value: number | string): number {
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeStatus(state: RawVercelDeployment["readyState"]): VercelDeploymentStatus {
  switch (state) {
    case "READY":
      return "READY";
    case "BUILDING":
      return "BUILDING";
    case "ERROR":
      return "ERROR";
    case "QUEUED":
      return "QUEUED";
    case "CANCELED":
      return "CANCELED";
    default:
      return "ERROR";
  }
}

async function fetchVercelDeployments(): Promise<VercelDeploymentMap> {
  const token = process.env.VERCEL_TOKEN;

  if (!token) {
    return {};
  }

  try {
    const res = await fetch(`${VERCEL_API_BASE}/v6/deployments?limit=50`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return {};
    }

    const json = (await res.json()) as { deployments?: RawVercelDeployment[] };
    const deployments = json.deployments ?? [];

    const latestByProject = deployments.reduce<VercelDeploymentMap>(
      (acc, d) => {
        if (!d.name) return acc;

        const createdAtMs = normalizeCreatedAt(d.createdAt);
        const existing = acc[d.name];

        if (!existing || createdAtMs > Date.parse(existing.createdAt)) {
          const status = normalizeStatus(d.readyState);

          acc[d.name] = {
            name: d.name,
            status,
            url: d.url ?? null,
            createdAt: new Date(createdAtMs).toISOString(),
          };
        }

        return acc;
      },
      {},
    );

    return latestByProject;
  } catch {
    return {};
  }
}

function mapDeploymentStatus(status: VercelDeploymentStatus): DeployStatus {
  if (status === "READY") return "READY";
  if (status === "BUILDING" || status === "QUEUED") return "BUILDING";
  if (status === "ERROR" || status === "CANCELED") return "ERROR";
  return null;
}

function formatTimeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "unknown";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} days ago`;
}

type ProjectWithActivity = Project & { lastActivityAt: string };

async function getProjects(): Promise<{
  projects: ProjectWithActivity[];
  deploymentCount: number;
}> {
  const [githubProjects, vercelDeployments] = await Promise.all([
    fetchGithubProjects(),
    fetchVercelDeployments(),
  ]);

  const merged: ProjectWithActivity[] = githubProjects
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .map((proj) => {
      const deployment = vercelDeployments?.[proj.name];

      const deployStatus: DeployStatus = deployment
        ? mapDeploymentStatus(deployment.status)
        : null;

      const lastCommitMessage =
        proj.lastCommit?.message ?? "No commits yet";
      const lastCommitDate = proj.lastCommit?.date ?? proj.updatedAt;

      return {
        name: proj.name,
        languages: proj.language ? [proj.language] : [],
        lastCommit: lastCommitMessage,
        lastCommitAgo: formatTimeAgo(lastCommitDate),
        deployStatus,
        deployUrl: deployment?.url ?? null,
        commitActivity: Array.isArray(proj.commitActivity)
          ? proj.commitActivity
          : [],
        lastActivityAt: deployment?.createdAt ?? lastCommitDate,
      };
    });

  const deploymentCount = Object.keys(vercelDeployments).length;

  return { projects: merged, deploymentCount };
}

export default async function Home() {
  const { projects: projectsWithActivity, deploymentCount } = await getProjects();

  const projects: Project[] = projectsWithActivity;
  const repoCount = projects.length;

  const lastActivityAt = projectsWithActivity.reduce<string | null>(
    (latest, proj) => {
      const currentTime = new Date(proj.lastActivityAt).getTime();
      if (!Number.isFinite(currentTime)) return latest;
      if (!latest) return proj.lastActivityAt;
      const latestTime = new Date(latest).getTime();
      return currentTime > latestTime ? proj.lastActivityAt : latest;
    },
    null,
  );

  const lastActivityAgo = lastActivityAt
    ? formatTimeAgo(lastActivityAt)
    : "—";

  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] px-4 pt-10 sm:px-8 sm:pt-16">
      <Header
        repoCount={repoCount}
        deploymentCount={deploymentCount}
        lastActivityAgo={lastActivityAgo}
      />

      <section className="mx-auto max-w-3xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </section>
    </main>
  );
}
