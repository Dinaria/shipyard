import Header from "../components/Header";
import ProjectCard from "../components/ProjectCard";
import type { Project, DeployStatus } from "../types";

function getApiBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

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

type VercelDeploymentMap = Record<string, VercelDeployment>;

async function fetchGithubProjects(baseUrl: string): Promise<GithubProject[] | null> {
  try {
    const res = await fetch(`${baseUrl}/api/github`, {
      method: "GET",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as GithubProject[];
    if (!Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

async function fetchVercelDeployments(baseUrl: string): Promise<VercelDeploymentMap | null> {
  try {
    const res = await fetch(`${baseUrl}/api/vercel`, {
      method: "GET",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as VercelDeploymentMap;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
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

async function getProjects(): Promise<ProjectWithActivity[]> {
  const baseUrl = getApiBaseUrl();
  const [githubProjects, vercelDeployments] = await Promise.all([
    fetchGithubProjects(baseUrl),
    fetchVercelDeployments(baseUrl),
  ]);

  if (!githubProjects) {
    return [];
  }

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

  return merged;
}

export default async function Home() {
  const projectsWithActivity = await getProjects();

  const projects: Project[] = projectsWithActivity;
  const repoCount = projects.length;
  const deploymentCount = 0;

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
