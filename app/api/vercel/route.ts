import { NextResponse } from "next/server";

type DeploymentStatus = "READY" | "BUILDING" | "ERROR" | "QUEUED" | "CANCELED";

type Deployment = {
  name: string;
  status: DeploymentStatus;
  url: string | null;
  createdAt: string;
};

type VercelDeployment = {
  name: string;
  url?: string;
  createdAt: number | string;
  readyState: DeploymentStatus | string;
};

const VERCEL_API_BASE = "https://api.vercel.com";

export async function GET() {
  const token = process.env.VERCEL_TOKEN;

  if (!token) {
    return respondWithDeployments({});
  }

  try {
    const res = await fetch(`${VERCEL_API_BASE}/v6/deployments?limit=50`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      // Invalid token or other API issue: return empty object but don't error the route.
      return respondWithDeployments({});
    }

    const json = (await res.json()) as { deployments?: VercelDeployment[] };
    const deployments = json.deployments ?? [];

    const latestByProject = deployments.reduce<Record<string, Deployment>>(
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

    return respondWithDeployments(latestByProject);
  } catch {
    return respondWithDeployments({});
  }
}

function normalizeCreatedAt(value: number | string): number {
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeStatus(state: VercelDeployment["readyState"]): DeploymentStatus {
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

function respondWithDeployments(data: Record<string, Deployment>) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}

