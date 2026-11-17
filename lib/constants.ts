export const ROLES = ["ADMIN", "USER"] as const;
export type Role = (typeof ROLES)[number];

export const VIDEO_SOURCES = ["NONE", "UPLOAD", "EXTERNAL"] as const;
export type VideoSource = (typeof VIDEO_SOURCES)[number];

export const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABEL: Record<Level, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const VIDEO_EXTENSIONS = [".mp4", ".m4v", ".webm", ".ogv"] as const;
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export const SESSION_COOKIE = "academy_session";
export const SESSION_DAYS = 7;

export const SITE_NAME = "MineOpt Academy";
export const SITE_TAGLINE = "Learn every MineOpt feature, one short video at a time.";
