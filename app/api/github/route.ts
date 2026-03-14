import { NextResponse } from "next/server";

type Project = {
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

export async function GET() {
  const username = process.env.GITHUB_USERNAME;

  if (!username) {
    return NextResponse.json(
      { error: "GITHUB_USERNAME is not configured" },
      { status: 500 },
    );
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
      return NextResponse.json(
        { error: "Failed to fetch repositories from GitHub" },
        { status: reposRes.status },
      );
    }

    const repos = (await reposRes.json()) as GitHubRepo[];

    const projects: Project[] = await Promise.all(
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

    return NextResponse.json(projects, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error while fetching GitHub data" },
      { status: 500 },
    );
  }
}

async function fetchLatestCommit(
  owner: string,
  repo: string,
): Promise<Project["lastCommit"]> {
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

