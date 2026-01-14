import type { UserPlan } from "./resourcesRegistry";

export type VideoResourceSection = "writing" | "listening" | "reading" | "speaking";
export type VideoResourceMediaType = "video" | "file";

export type VideoResourceRule = {
  title: string;
  section: VideoResourceSection;
  mediaType: VideoResourceMediaType;
  requiredPlan: UserPlan;
  teacher?: string;
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
    teacher: "Shirin 9.0",
    href: `${LESSONS_REPORTS_BASE_URL}/shirin/video5376445830.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
  "B3Z8qM6A9T": {
    title: "Linking sentences in Task 2",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    teacher: "Shirin 9.0",
    href: `${LESSONS_REPORTS_BASE_URL}/shirin/video2993536838.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
  "K7A9M2Qz8B": {
    title: "How to write overviews in Task 1",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    teacher: "Shirin 9.0",
    href: `${LESSONS_REPORTS_BASE_URL}/shirin/video5742279084.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
  "A8Z9B6M2Qt": {
    title: "How to work with AI to improve speaking",
    section: "speaking",
    mediaType: "video",
    requiredPlan: "free",
    teacher: "Shirin 9.0",
    href: `${LESSONS_REPORTS_BASE_URL}/shirin/video2140512538.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
  "P9M6ZB8A2k": {
    title: "Idea generation for writing Task 2",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    teacher: "Shirin 9.0",
    href: `${LESSONS_REPORTS_BASE_URL}/shirin/video3750045404.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
  "G7K2m9B4QX": {
    title: "Trend graphs in Task 1",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    teacher: "Nozima Qadamova 9.0",
    href: `${LESSONS_REPORTS_BASE_URL}/nozima-qadamova/video1978912924.mp4`,
    telegramHref: "https://t.me/nozima_writes",
  },
  "F9a5Z2M7YC": {
    title: "Comparison graphs",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    teacher: "Nozima Qadamova 9.0",
    href: `${LESSONS_REPORTS_BASE_URL}/nozima-qadamova/video1106821846.mp4`,
    telegramHref: "https://t.me/nozima_writes",
  },
  "R2K9P5X8LF": {
    title: "Writing Reports",
    section: "writing",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Nozima Qadamova 9.0",
    href: `${LESSONS_REPORTS_BASE_URL}/nozima-qadamova/writing-toward-clarity.pdf`,
    telegramHref: "https://t.me/nozima_writes",
  },
  "G7K2M9P4qX": {
    title: "How to write overviews for processes",
    section: "writing",
    mediaType: "video",
    requiredPlan: "free",
    teacher: "Shirin 9.0",
    href: `${LESSONS_REPORTS_BASE_URL}/shirin/video3734014428.mp4`,
    telegramHref: "https://t.me/sweetsielts",
  },
};
