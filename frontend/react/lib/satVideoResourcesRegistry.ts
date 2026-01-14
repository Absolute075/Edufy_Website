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
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video1403153147.mp4`,
  },
  "A7F9K2Q8m4": {
    title: "Lesson 1 - Reading",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video5884924978.mp4`,
  },
  "A9M4Q2kFX7": {
    title: "Lesson 1 - Homework",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/1-lesson-homework.pdf`,
  },
  "F5qV2bH8Rt": {
    title: "Lesson 2 - Writing",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video4377113700.mp4 `,
  },
};
