import type { UserPlan } from "./resourcesRegistry";

export type SatVideoResourceSection = "math" | "english" | "general";
export type SatVideoResourceMediaType = "video" | "file";

export type SatVideoResourceRule = {
  title: string;
  section: SatVideoResourceSection | SatVideoResourceSection[];
  mediaType: SatVideoResourceMediaType;
  requiredPlan: UserPlan;
  teacher?: string;
  href?: string;
  telegramHref?: string;
};

export const SAT_LESSONS_REPORTS_BASE_URL =
  "https://resources.edufyuzbekistan.com/materials/lessons-reports-sat";

export const satVideoResourcesRegistry: Record<string, SatVideoResourceRule> = {
  "M2QF9A7X4k": {
    title: "Introduction Lesson",
    section: "general",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/678368.mp4`,
  },
  "7M4A2XqF9K": {
    title: "Lesson 1 - Reading",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/598412.mp4`,
  },
};
