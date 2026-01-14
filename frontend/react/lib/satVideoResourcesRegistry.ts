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
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video4377113700.mp4`,
  },
  "H2pV7nL0Ka": {
    title: "Lesson 2 - Homework",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/2-lesson-homework.pdf`,
  },
  "N8wR4mT7Qy": {
    title: "Lesson 3 - Math",
    section: "math",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video2339350013.mp4`,
  },
  "S2tM8bL6Xq": {
    title: "Lesson 3 - Homework",
    section: "math",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/3-lesson-homework.pdf`,
  },
  "W0pL7mH4Zq": {
    title: "Lesson 4 - Reading",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video6269049673.mp4`,
  },
  "Q7fH3vN0Ls": {
    title: "Lesson 4 - Homework",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/4-lesson-homework.pdf`,
  },
  "D3bR9xV1Km": {
    title: "Lesson 5 - Writing",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video7772435514.mp4`,
  },
  "Y4cR1nK7Wp": {
    title: "Lesson 5 - Homework",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/5-lesson-homework.pdf`,
  },
  "P3mL8gH1Xp": {
    title: "Lesson 6 - Math",
    section: "math",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video4455807547.mp4`,
  },
  "A0cL2rP7Xy": {
    title: "Lesson 6 - Homework",
    section: "math",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/6-lesson-homework.pdf`,
  },
  "V1nL5gH9Kt": {
    title: "Lesson 7 - Reading",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video1759698401.mp4`,
  },
  "L9tN1vJ6Tb": {
    title: "Lesson 7 - Homework",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/7-lesson-homework.pdf`,
  },
  "J1tR7kP2Ly": {
    title: "Lesson 8 - Reading",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video3000717614.mp4`,
  },
  "F9cL3rN2Xy": {
    title: "Lesson 8 - Homework",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/8-lesson-homework.pdf`,
  },
  "K0nM6xJ7Lp": {
    title: "Lesson 9 - Math",
    section: "math",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video5662825282.mp4`,
  },
  "S9pJ4gL0Ly": {
    title: "Lesson 9 - Homework",
    section: "math",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/9-lesson-homework.pdf`,
  },
  "K1tN6vJ3Tb": {
    title: "Lesson 10 - Reading",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video6673839533.mp4`,
  },
  "H9pX0xQ5Lp": {
    title: "Lesson 10 - Homework",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/10-lesson-homework.pdf`,
  },
  "P2nL8gH4Kt": {
    title: "Lesson 11 - Writing",
    section: "english",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video2913730344.mp4`,
  },
  "N5kM3rP7Mb": {
    title: "Lesson 11 - Homework",
    section: "english",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/11-lesson-homework.pdf`,
  },
  "L0mF6vN2Xp": {
    title: "Lesson 12 - Math",
    section: "math",
    mediaType: "video",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/video6393801182.mp4`,
  },
  "R7pJ1gL8Ly": {
    title: "Lesson 12 - Homework",
    section: "math",
    mediaType: "file",
    requiredPlan: "premium",
    teacher: "Marstiff Teachers",
    href: `${SAT_LESSONS_REPORTS_BASE_URL}/marstiff-teachers/12-lesson-homework.pdf`,
  },
};
