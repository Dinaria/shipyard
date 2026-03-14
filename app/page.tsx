import Header from "../components/Header";
import ProjectCard from "../components/ProjectCard";
import type { Project } from "../types";

const projects: Project[] = [
  {
    name: "shipyard",
    languages: ["TypeScript"],
    lastCommit: "init: dashboard layout and dark theme",
    lastCommitAgo: "5 min ago",
    deployStatus: "BUILDING",
    deployUrl: null,
  },
  {
    name: "my-portfolio",
    languages: ["TypeScript", "CSS"],
    lastCommit: "fix: update header spacing",
    lastCommitAgo: "2 hours ago",
    deployStatus: "READY",
    deployUrl: "my-portfolio.vercel.app",
  },
  {
    name: "vuln-triage",
    languages: ["TypeScript"],
    lastCommit: "feat: add severity filter",
    lastCommitAgo: "1 day ago",
    deployStatus: "READY",
    deployUrl: "vuln-triage.vercel.app",
  },
  {
    name: "experiments",
    languages: ["JavaScript"],
    lastCommit: "try: three.js particle system",
    lastCommitAgo: "3 days ago",
    deployStatus: "ERROR",
    deployUrl: null,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] px-4 pt-10 sm:px-8 sm:pt-16">
      <Header />

      {/* Projects grid */}
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
