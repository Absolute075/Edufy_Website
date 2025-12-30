export type ArticleTag = "education" | "environment" | "technology" | "health" | "magazine" | "general";

export type ArticleRule = {
  title: string;
  file: string;
  tags: ArticleTag[];
  minutes?: number;
  source?: string;
  description?: string;
};

export const ARTICLES_BASE_URL = "https://resources.edufyuzbekistan.com/materials/articles";

export const articlesRegistry: Record<string, ArticleRule> = {
  "education-01": {
    title: "Education (Sample PDF)",
    file: "education-sample.pdf",
    tags: ["education"],
    minutes: 10,
    description: "Replace this with a real PDF from /materials/articles/",
  },
  "technology-01": {
    title: "Technology (Sample PDF)",
    file: "technology-sample.pdf",
    tags: ["technology"],
    minutes: 12,
    description: "Replace this with a real PDF from /materials/articles/",
  },
};
