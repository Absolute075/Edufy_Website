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
  "A7f9K2Qm8Z": {
    title: "How to write overviews for maps/layouts in Task 1",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    href: `${LESSONS_REPORTS_BASE_URL}/video5376445830.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
  "B3Z8qM6A9T": {
    title: "Linking sentences in Task 2",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    href: `${LESSONS_REPORTS_BASE_URL}/video2993536838.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
  "K7A9M2Qz8B": {
    title: "How to write overviews in Task 1",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    href: `${LESSONS_REPORTS_BASE_URL}/video5742279084.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
  "A8Z9B6M2Qt": {
    title: "How to work with AI to improve speaking",
    section: "speaking",
    mediaType: "video",
    requiredPlan: "free",
    href: `${LESSONS_REPORTS_BASE_URL}/video2140512538.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
};
