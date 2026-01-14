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
    teacher: "marstiff-teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/598412.mp4`,
  },
  "A7F9K2Q8m4": {
    title: "Lesson 1 - Reading",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "marstiff-teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/8473926150.mp4`,
  },
  "A9M4Q2kFX7": {
    title: "Lesson 1 - Homework",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "marstiff-teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/1-lesson-reading.pdf`,
  },
};
