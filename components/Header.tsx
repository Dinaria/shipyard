type HeaderProps = {
  repoCount: number;
  deploymentCount: number;
  lastActivityAgo: string;
};

export default function Header({
  repoCount,
  deploymentCount,
  lastActivityAgo,
}: HeaderProps) {
  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between gap-2 pb-8">
      <div className="flex items-center gap-3 text-[1.3rem]">
        <span className="font-mono font-semibold tracking-tight text-white">Shipyard</span>
        <span className="hidden h-1.5 w-1.5 rounded-full bg-green-500 sm:inline-block" />
        <span className="font-mono text-xs font-light text-neutral-400">Dina</span>
      </div>
      <div className="flex gap-5 text-sm font-mono">
        <div className="flex items-center gap-1 text-neutral-300">
          <span className="text-neutral-500">Repos:</span>{" "}
          <span className="font-semibold text-white">{repoCount}</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-300">
          <span className="text-neutral-500">Deploys:</span>{" "}
          <span className="font-semibold text-white">{deploymentCount}</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-300">
          <span className="text-neutral-500">Last:</span>{" "}
          <span className="text-white">{lastActivityAgo}</span>
        </div>
      </div>
    </header>
  );
}

