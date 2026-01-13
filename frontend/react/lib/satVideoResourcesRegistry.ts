import type { UserPlan } from "./resourcesRegistry";

export type SatVideoResourceSection = "math" | "english" | "general";
export type SatVideoResourceMediaType = "video" | "file";

export type SatVideoResourceRule = {
  title: string;
  section: SatVideoResourceSection;
  mediaType: SatVideoResourceMediaType;
  requiredPlan: UserPlan;
  href?: string;
  telegramHref?: string;
};

export const SAT_LESSONS_REPORTS_BASE_URL =
  "https://resources.edufyuzbekistan.com/materials/lessons-reports-sat";

export const satVideoResourcesRegistry: Record<string, SatVideoResourceRule> = {
  "sat-math-01-linear-equations": {
    title: "Linear Equations — Basics",
    section: "math",
    mediaType: "video",
    requiredPlan: "free",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/videos/math/linear-equations-basics.mp4`,
  },
  "sat-math-02-functions": {
    title: "Functions — Introduction",
    section: "math",
    mediaType: "video",
    requiredPlan: "premium",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/videos/math/functions-intro.mp4`,
  },
  "sat-math-worksheet-01": {
    title: "Math Worksheet — Practice Set 1 (PDF)",
    section: "math",
    mediaType: "file",
    requiredPlan: "free",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/files/math/worksheet-practice-set-1.pdf`,
  },
  "sat-eng-01-grammar-punctuation": {
    title: "Grammar — Punctuation Essentials",
    section: "english",
    mediaType: "video",
    requiredPlan: "free",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/videos/english/grammar-punctuation-essentials.mp4`,
  },
  "sat-eng-02-reading-strategies": {
    title: "Reading — Main Idea & Inference",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/videos/english/reading-main-idea-inference.mp4`,
  },
  "sat-eng-report-01": {
    title: "English Report — Common Mistakes (PDF)",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/files/english/report-common-mistakes.pdf`,
  },
  "sat-general-01-how-to-use": {
    title: "How to Use These Materials",
    section: "general",
    mediaType: "video",
    requiredPlan: "free",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/videos/general/how-to-use.mp4`,
  },
};
