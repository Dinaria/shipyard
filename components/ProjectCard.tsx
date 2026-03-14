"use client";

import type { Project } from "../types";
import StatusPill from "./StatusPill";
import Sparkline from "./Sparkline";

const baseSparkline: number[] = [
  0, 1, 3, 2, 0, 5, 3, 1, 0, 0, 2, 4, 1, 0, 3, 2, 1, 0, 0, 1, 5, 7, 3, 2, 1, 0,
  0, 2, 3, 1,
];

const sparklineByProject: Record<string, number[]> = {
  shipyard: baseSparkline,
  "my-portfolio": baseSparkline.map((v, i) => (i % 5 === 0 ? v + 1 : v)),
  "vuln-triage": baseSparkline.map((v, i) => (i % 3 === 0 ? v + 2 : v)),
  experiments: baseSparkline.map((v, i) => (i % 4 === 0 ? Math.max(0, v - 1) : v)),
};

type ProjectCardProps = {
  project: Project;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const sparklineData = sparklineByProject[project.name] ?? baseSparkline;

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

