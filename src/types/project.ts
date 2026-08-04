import type { Prisma } from "@/generated/prisma/client";
import type { projectDetailInclude } from "@/server/repositories/project.repository";

export type ProjectDetail = Prisma.ProjectGetPayload<{ include: typeof projectDetailInclude }>;

/** Shape of `ProjectDetail` after a JSON.stringify/parse round trip (e.g. the polling fetch response). */
export type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

/**
 * Canonical shape used by every client component in the project workspace.
 * `ProjectWorkspace` normalizes the server-provided `ProjectDetail` (real
 * `Date` objects, via the RSC wire format) to this shape once on mount, so
 * it matches what the `/api/projects/[id]` polling endpoint returns.
 */
export type SerializedProjectDetail = Serialized<ProjectDetail>;
export type AgentExecutionDetail = SerializedProjectDetail["agentExecutions"][number];
export type GeneratedContentDetail = SerializedProjectDetail["generatedContents"][number];
export type ProjectMessageDetail = SerializedProjectDetail["messages"][number];
