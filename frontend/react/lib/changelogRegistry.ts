export type ChangelogLabel =
  | "New Features"
  | "Improvements"
  | "Bug Fixes"
  | "Performance"
  | "Security"
  | "Deprecation";

export type ChangelogSection = {
  title: string;
  items: string[];
};

export type ChangelogEntry = {
  id: string;
  title: string;
  date: string;
  labels: ChangelogLabel[];
  summary?: string;
  sections: ChangelogSection[];
};

const entries = [
  {
    id: "2026-01-16-resources-scan",
    title: "Automated Resources Error Scanner",
    date: "2026-01-16",
    labels: ["New Features", "Improvements"],
    summary: "Added Playwright-based scripts to scan /resources pages for 404/5xx and client-side errors.",
    sections: [
      {
        title: "New Features",
        items: [
          "Added scripts to save session state and scan Resources pages with Playwright.",
          "Report generation: JSON report with outcomes, JS errors and failing responses.",
        ],
      },
      {
        title: "How to run",
        items: [
          "Run auth:save once to store session cookies.",
          "Run scan:resources to generate a report in frontend/react/reports.",
        ],
      },
    ],
  },
  {
    id: "2026-01-10-custom-errors",
    title: "Custom 404 and 5xx pages",
    date: "2026-01-10",
    labels: ["Improvements"],
    summary: "Introduced custom not-found and error pages with consistent dark styling.",
    sections: [
      {
        title: "Improvements",
        items: [
          "Added custom 404 page with a single navigation button.",
          "Added custom error and global error pages with retry + home actions.",
        ],
      },
    ],
  },
  {
    id: "2026-01-05-reactions",
    title: "Likes/Dislikes reactions (no comments)",
    date: "2026-01-05",
    labels: ["Improvements", "Bug Fixes"],
    summary: "Removed comment system from SAT/IELTS lesson reports and kept mutually exclusive like/dislike.",
    sections: [
      {
        title: "Improvements",
        items: ["Simplified lesson report interactions UI to only like/dislike."],
      },
      {
        title: "Bug Fixes",
        items: ["Fixed state handling to keep reactions mutually exclusive."],
      },
    ],
  },
] satisfies ChangelogEntry[];

export const changelogEntries: ChangelogEntry[] = [...entries].sort((a, b) =>
  b.date.localeCompare(a.date)
);

export const changelogLabels: ChangelogLabel[] = [
  "New Features",
  "Improvements",
  "Bug Fixes",
  "Performance",
  "Security",
  "Deprecation",
];
