export type ArticleTag = "education" | "environment" | "science" | "lifestyle" | "technology" | "wellbeing" | "research" | "magazine" | "general";

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
  "general-01": {
    title: "The bitter truth about sugar",
    file: "general-01.pdf",
    preview: "general-01.png",
    tags: ["general"],
    pages: 8,
    description: "It’s no secret that Americans have a serious addiction. Here’s how to cut back on the sweet stuff, once and for all.",
  },
  "general-02": {
    title: "Caffeine: The unfiltered truth",
    file: "general-02.pdf",
    preview: "general-02.png",
    tags: ["general"],
    pages: 4,
    description: "How worried should we be about our love for coffee and energy drinks? Jasmin Fox-Skelly investigates.",
  },
  "general-03": {
    title: "Tasty Tacos",
    file: "general-03.pdf",
    preview: "general-03.png",
    tags: ["general"],
    pages: 4,
    description: "Those shells hold a lot of history",
  },
  "general-04": {
    title: "They came by sea...",
    file: "general-04.pdf",
    preview: "general-04.png",
    tags: ["general"],
    pages: 4,
    description: "It is one of the greatest mysteries of ancient history: who were the Sea Peoples blamed for the destruction of a string of civilisations 3000 years ago? Colin Barras investigates",
  },
  "general-05": {
    title: "Free of the Past",
    file: "general-05.pdf",
    preview: "general-05.png",
    tags: ["general"],
    pages: 2,
    description: "When you liberate yourself from the ties hat bind you, you'll never look back...",
  },
  "lifestyle-04": {
    title: "Your job is what?",
    file: "lifestyle-04.pdf",
    preview: "lifestyle-04.png",
    tags: ["lifestyle"],
    pages: 8,
    description: "LOOKING FOR A CAREER CHANGE? CHECK OUT THESE UNCONVENTIONAL GIGS",
  },
  "science-02": {
    title: "The lost humans",
    file: "science-02.pdf",
    preview: "science-02.png",
    tags: ["science"],
    pages: 4,
    description: "Over tens of thousands of years, waves of Homo sapiens set out across Europe and Asia, only to mysteriously vanish. At last, ancient DNA is revealing why, finds Michael Marshall.",
  },
  "science-03": {
    title: "Deep sleep seems to lead to more eureka moments",
    file: "science-03.pdf",
    preview: "science-03.png",
    tags: ["science"],
    pages: 1,
    description: "We're at the very beginning of uncovering what makes sleep so beneficial",
  },
  "wellbeing-03": {
    title: "Freaky Phobias",
    file: "wellbeing-03.pdf",
    preview: "wellbeing-03.png",
    tags: ["wellbeing"],
    pages: 3,
    description: "Just because it doesn’t make sense doesn’t make it any less scary",
  },
  "general-06": {
    title: "Death House",
    file: "general-06.pdf",
    preview: "general-06.png",
    tags: ["general"],
    pages: 5,
    description: "THE SMELL OF BREAKFAST DRIFTED UPSTAIRS. IT MADE THE BEDROOM FEEL HOMEY RATHER THAN LIKE A HOSTEL. BUT BY NIGHT, THE DRUGGED TENANT AWAITED BURIAL IN THE BACK GARDEN...  OURTESY OF THE OLD LANDLADY",
  },
  "general-07": {
    title: "THE KIDNAPPING OF PATTY HEARST",
    file: "general-07.pdf",
    preview: "general-07.png",
    tags: ["general"],
    pages: 7,
    description: "Heiress patty hearst's time as a gun-toting militia member both shocked and confused onlookers. Who could help but wonder if she was a willing participant or a brainwashed bandit?",
  },
  "environment-01": {
    title: "TUNING IN TO NATURE",
    file: "environment-01.pdf",
    preview: "environment-01.png",
    tags: ["environment"],
    pages: 4,
    description: "Discover joy by letting go and letting your mind wander in the outside world",
  },
  "lifestyle-05": {
    title: "Parenting Is a Joke!",
    file: "lifestyle-05.pdf",
    preview: "lifestyle-05.png",
    tags: ["lifestyle"],
    pages: 4,
    description: "This Mother's Day and Father's Day, let's all take some time to laugh at our kids",
  },
  "lifestyle-06": {
    title: "Samurai",
    file: "lifestyle-06.pdf",
    preview: "lifestyle-06.png",
    tags: ["lifestyle"],
    pages: 7,
    description: "Walking the path of the warrior is not for everyone",
  },
};