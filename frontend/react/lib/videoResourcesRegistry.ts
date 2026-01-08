import type { UserPlan } from "./resourcesRegistry";

export type VideoResourceSection = "writing" | "listening" | "reading" | "speaking";
export type VideoResourceMediaType = "video" | "file";

export type VideoResourceRule = {
  title: string;
  section: VideoResourceSection;
  mediaType: VideoResourceMediaType;
  requiredPlan: UserPlan;
  href?: string;
  telegramHref?: string;
};

export const LESSONS_REPORTS_BASE_URL =
  "https://resources.edufyuzbekistan.com/materials/lessons-reports";

export const videoResourcesRegistry: Record<string, VideoResourceRule> = {
  "writing-band-report-task-1": {
    title: "How to write overviews for maps/layouts",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    href: `${LESSONS_REPORTS_BASE_URL}/video5376445830.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
  "writing-band-report-task-2": {
    title: "Linking sentences in Task 2",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    href: `${LESSONS_REPORTS_BASE_URL}/video2993536838.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
};
