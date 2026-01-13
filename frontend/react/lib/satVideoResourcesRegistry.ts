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
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/6783368.mp4`,
  },
  "sat-math-02-functions": {
    title: "Functions — Introduction",
    section: "math",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Teacher A",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/videos/math/functions-intro.mp4`,
  },
  "sat-math-worksheet-01": {
    title: "Math Worksheet — Practice Set 1 (PDF)",
    section: "math",
    mediaType: "file",
    requiredPlan: "free",
    teacher: "Teacher A",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/files/math/worksheet-practice-set-1.pdf`,
  },
  "sat-eng-01-grammar-punctuation": {
    title: "Grammar — Punctuation Essentials",
    section: "english",
    mediaType: "video",
    requiredPlan: "free",
    teacher: "Teacher B",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/videos/english/grammar-punctuation-essentials.mp4`,
  },
  "sat-eng-02-reading-strategies": {
    title: "Reading — Main Idea & Inference",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Teacher B",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/videos/english/reading-main-idea-inference.mp4`,
  },
  "sat-eng-report-01": {
    title: "English Report — Common Mistakes (PDF)",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Teacher B",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/files/english/report-common-mistakes.pdf`,
  },
  "sat-general-01-how-to-use": {
    title: "How to Use These Materials",
    section: "general",
    mediaType: "video",
    requiredPlan: "free",
    teacher: "Team Edufy",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/videos/general/how-to-use.mp4`,
  },
};
