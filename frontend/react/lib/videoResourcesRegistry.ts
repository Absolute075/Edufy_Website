import type { UserPlan } from "./resourcesRegistry";

export type VideoResourceSection = "writing" | "listening" | "reading" | "speaking";
export type VideoResourceMediaType = "pdf" | "video" | "file";

export type VideoResourceRule = {
  title: string;
  section: VideoResourceSection;
  mediaType: VideoResourceMediaType;
  requiredPlan: UserPlan;
  href?: string;
};

export const LESSONS_REPORTS_BASE_URL =
  "https://resources.edufyuzbekistan.com/materials/lessons-reports";

export const videoResourcesRegistry: Record<string, VideoResourceRule> = {
  "writing-band-report-task-1": {
    title: "How to write overviews for maps/layouts",
    section: "writing",
    mediaType: "video",
    requiredPlan: "premium",
    href: `${LESSONS_REPORTS_BASE_URL}/video5376445830-shirin-9.0.mp4`,
  },
  "listening-mcq-explanations": {
    title: "Listening: MCQ explanations",
    section: "listening",
    mediaType: "video",
    requiredPlan: "free",
    href: `${LESSONS_REPORTS_BASE_URL}/listening-mcq-explanations.mp4`,
  },
  "reading-tfng-strategy": {
    title: "Reading: TFNG strategy lesson",
    section: "reading",
    mediaType: "video",
    requiredPlan: "free",
    href: `${LESSONS_REPORTS_BASE_URL}/reading-tfng-strategy.mp4`,
  },
  "speaking-part-2-feedback": {
    title: "Speaking: Part 2 feedback",
    section: "speaking",
    mediaType: "file",
    requiredPlan: "premium",
    href: `${LESSONS_REPORTS_BASE_URL}/speaking-part-2-feedback.zip`,
  },
};
