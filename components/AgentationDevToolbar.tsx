"use client";

import { Agentation } from "agentation";

export default function AgentationDevToolbar() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Agentation endpoint="http://localhost:4747" />;
}

