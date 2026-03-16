"use client";

import type { Project } from "../types";
import StatusPill from "./StatusPill";
import Sparkline from "./Sparkline";

type ProjectCardProps = {
  project: Project;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const hasRealActivity =
    Array.isArray(project.commitActivity) &&
    project.commitActivity.some((value) => value > 0);

  let sparklineData: number[];

  if (hasRealActivity) {
    const last30 = project.commitActivity.slice(-30);
    const padded =
      last30.length < 30
        ? [...Array(30 - last30.length).fill(0), ...last30]
        : last30;
    sparklineData = padded;
  } else {
    sparklineData = Array(30).fill(0);
  }

  return (
    <div className="bg-[#141414] border border-[#1e1e1e] rounded-lg p-4 transition hover:border-[#2e2e2e] flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-white">{project.name}</span>
        <StatusPill status={project.deployStatus} />
      </div>

      <div className="flex flex-wrap gap-2 py-1">
        {project.languages.map((lang) => (
          <span
            key={lang}
            className="inline-block rounded px-2 py-0.5 text-xs font-mono bg-neutral-800 text-neutral-400"
          >
            {lang}
          </span>
        ))}
      </div>

      <div className="h-8 w-full rounded bg-neutral-800 overflow-hidden">
        <Sparkline data={sparklineData} />
      </div>

      <div className="truncate text-sm text-neutral-400">{project.lastCommit}</div>

      <div className="flex items-end justify-between pt-2">
        <span className="text-xs text-neutral-500">{project.lastCommitAgo}</span>
        {project.deployStatus === "READY" && project.deployUrl && (
          <a
            href={`https://${project.deployUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
          >
            {project.deployUrl}
            <svg
              className="h-3 w-3 text-blue-400"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 10l4-4m0 0V9m0-3h-3"
              />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

