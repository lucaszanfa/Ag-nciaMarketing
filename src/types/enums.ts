/**
 * SQLite has no native enum type, so `schema.prisma` stores these as plain
 * `String` columns. These TS unions replace the enum types Prisma would
 * otherwise generate, so application code keeps the same compile-time safety.
 * Zod schemas in `src/validations` and `src/services/ai/schemas` are the
 * runtime boundary that actually enforces these values.
 */
export type ProjectStatus =
  | "DRAFT"
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "COMPLETED"
  | "FAILED"
  | "ARCHIVED";

export type AgentType =
  | "CEO"
  | "CHIEF_EDITOR"
  | "LINKEDIN_WRITER"
  | "INSTAGRAM_WRITER"
  | "CAMPAIGN_WRITER"
  | "REVIEWER";

export type AgentStatus =
  | "WAITING"
  | "WORKING"
  | "COMPLETED"
  | "COMPLETED_WITH_FALLBACK"
  | "NEEDS_ADJUSTMENT"
  | "FAILED"
  | "SKIPPED";

export type Platform = "LINKEDIN" | "INSTAGRAM" | "FACEBOOK" | "BLOG" | "EMAIL" | "GENERAL";

export type ContentFormat = "POST" | "CAROUSEL" | "REELS" | "STORIES" | "ARTICLE" | "CAMPAIGN_PLAN";

export type ContentStatus =
  | "DRAFT"
  | "REVIEWED"
  | "UNDER_AI_REVIEW"
  | "AI_REVISING"
  | "WAITING_HUMAN_APPROVAL"
  | "APPROVED"
  | "NEEDS_ADJUSTMENT"
  | "REJECTED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

export type ReviewDecision = "APPROVED" | "NEEDS_ADJUSTMENT" | "REJECTED";

/** Origin of a GeneratedContentVersion row (see src/services/workflow/review-correction-coordinator.ts) */
export type ContentVersionSource =
  | "INITIAL_GENERATION"
  | "AUTOMATIC_REVISION"
  | "HUMAN_EDIT"
  | "HUMAN_REQUESTED_REVISION";

export type MessageAuthorType = "CEO" | "AGENT" | "SYSTEM" | "USER";
