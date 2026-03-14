import type { DeployStatus } from "../types";

type StatusPillProps = {
  status: DeployStatus;
};

export default function StatusPill({ status }: StatusPillProps) {
  if (status === "READY")
    return (
      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-300">
        Live
      </span>
    );
  if (status === "BUILDING")
    return (
      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-900 text-amber-300 animate-pulse">
        Building
      </span>
    );
  if (status === "ERROR")
    return (
      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300">
        Failed
      </span>
    );
  return (
    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-400">
      Not deployed
    </span>
  );
}

