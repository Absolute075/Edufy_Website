export type ArticleTag = "education" | "environment" | "science" | "lifestyle" | "technology" | "wellbeing" | "magazine" | "general";

export type ArticleRule = {
  title: string;
  file: string;
  preview?: string;
  tags: ArticleTag[];
  pages?: number;
  source?: string;
  description?: string;
};

export const ARTICLES_BASE_URL = "https://resources.edufyuzbekistan.com/materials/articles";

export const articlesRegistry: Record<string, ArticleRule> = {
  "lifestyle-01": {
    title: "Japan Culture",
    file: "lifestyle-01.pdf",
    preview: "lifestyle-01.png",
    tags: ["lifestyle"],
    pages: 2,
    description: "WHAT ARE THESE BEINGS CALLED KAMI, WHAT DO THEY REPRESENT, AND WHAT DO THEY MEAN TO THE PEOPLE OF JAPAN?",
  },
  "science-01": {
    title: "A numbers game",
    file: "science-01.pdf",
    preview: "science-01.png",
    tags: ["science"],
    pages: 4,
    description: "A long-running disagreement between physicists raises the deep question of how many numbers we need to describe reality, says Jacklin Kwan",
  },
  "wellbeing-01": {
    title: "Does your diet pass the acid test?",
    file: "wellbeing-01.pdf",
    preview: "wellbeing-01.png",
    tags: ["wellbeing"],
    pages: 5,
    description: "The food we eat has a surprising effect on the body that could lead to chronic illness -but luckily there's an easy fix, finds Graham Lawton",
  },
  "lifestyle-02": {
    title: "Time for a new you?",
    file: "lifestyle-02.pdf",
    preview: "lifestyle-02.png",
    tags: ["lifestyle"],
    pages: 1,
    description: "We sort ourselves into introverts and extroverts, but the truth is that personality is more malleable than you think, says Claudia Canavan",
  },
  "technology-01": {
    title: "Will Australia’s social media ban work?",
    file: "technology-01.pdf",
    preview: "technology-01.png",
    tags: ["technology"],
    pages: 2,
    description: "Social media platformswill soon have to exclude children under16 in Australia, but there are doubts over whether this is the right approach, finds James Woodford",
  },
  "lifestyle-03": {
    title: "15 Ways to make LIFE more FUN",
    file: "lifestyle-03.pdf",
    preview: "lifestyle-03.png",
    tags: ["lifestyle"],
    pages: 2,
    description: "Boredom got you down? Try these happiness hacks to boost your wellbeing",
  },
  "wellbeing-02": {
    title: "Your Mental Health",
    file: "wellbeing-02.pdf",
    preview: "wellbeing-02.png",
    tags: ["wellbeing"],
    pages: 6,
    description: "We look after our physical health, but our emotional wellbeing often gets neglected. It's time to make it a priority",
  },
};