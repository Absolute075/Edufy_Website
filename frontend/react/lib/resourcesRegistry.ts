export type UserPlan = "free" | "premium";
export type ResourceCategory = "reading" | "listening" | "writing" | "mock";

export type ResourceDifficulty = "easy" | "medium" | "hard";

export type ResourceExamType = "real" | "cambridge";

export type ResourceRule = {
  requiredPlan: UserPlan;
  title: string;
  examType: ResourceExamType;
  part: 1 | 2 | 3 | 4 | "full";
  difficulty: ResourceDifficulty;
  minutes: number;
  questions: number;
};

export const resourcesRegistry: Record<ResourceCategory, Record<string, ResourceRule>> = {
  reading: {
    "345897": {
      requiredPlan: "free",
      title: "The Role of Mothers in the Origins of Music",
      examType: "real",
      part: 2,
      difficulty: "medium",
      minutes: 20,
      questions: 12,
    },
    "369258": {
      requiredPlan: "free",
      title: "The Peopling of Patagonia",
      examType: "real",
      part: 3,
      difficulty: "medium",
      minutes: 20,
      questions: 14,
    },
    "321741": {
      requiredPlan: "free",
      title: "The Slow Food Organization",
      examType: "real",
      part: 1,
      difficulty: "easy",
      minutes: 20,
      questions: 13,
    },
    "856932": {
      requiredPlan: "free",
      title: "The New Zealand Writer Maurice Gee",
      examType: "real",
      part: 3,
      difficulty: "medium",
      minutes: 20,
      questions: 14,
    },
    "764852": {
      requiredPlan: "free",
      title: "History of the Globe Theatre",
      examType: "real",
      part: 1,
      difficulty: "easy",
      minutes: 20,
      questions: 13,
    },
    "349653": {
      requiredPlan: "free",
      title: "Recording History",
      examType: "real",
      part: 3,
      difficulty: "hard",
      minutes: 20,
      questions: 14,
    },
    "183692": {
      requiredPlan: "free",
      title: "Thinking for themselves: Some insights into animal intelligence",
      examType: "real",
      part: 3,
      difficulty: "hard",
      minutes: 20,
      questions: 14,
    },
    "168963": {
      requiredPlan: "free",
      title: "Solving the Problem of Waste Disposal",
      examType: "real",
      part: 2,
      difficulty: "medium",
      minutes: 20,
      questions: 13,
    },
    "497356": {
      requiredPlan: "free",
      title: "Global Warming in New Zealand",
      examType: "real",
      part: 3,
      difficulty: "hard",
      minutes: 20,
      questions: 14,
    },
    "168723": {
       requiredPlan: "free",
       title: "A New Look for Talbot Park",
       examType: "real",
       part: 2,
       difficulty: "medium",
       minutes: 20,
       questions: 13,
    },
    "465798": {
          requiredPlan: "free",
          title: "The New Zealand writer Margaret Mahy",
          examType: "real",
          part: 3,
          difficulty: "hard",
          minutes: 20,
          questions: 14,
    },
    "976485": {
      requiredPlan: "free",
      title: "The tuatara – past and future",
      examType: "real",
      part: 3,
      difficulty: "hard",
      minutes: 20,
      questions: 14,
    },
    "932569": {
          requiredPlan: "free",
          title: "The ability to communicate using language",
          examType: "real",
          part: 3,
          difficulty: "hard",
          minutes: 20,
          questions: 14,
    },
    "596168": {
      requiredPlan: "free",
      title: "Historical Impact of the California Gold Rush",
      examType: "real",
      part: 1,
      difficulty: "easy",
      minutes: 25,
      questions: 16,
    },

    "786169": {
      requiredPlan: "free",
      title: "Saturn Spectacular",
      examType: "real",
      part: 2,
      difficulty: "medium",
      minutes: 20,
      questions: 13,
    },

    "892183": {
      requiredPlan: "free",
      title: "Book Review on Musicophilia",
      examType: "real",
      part: 3,
      difficulty: "medium",
      minutes: 20,
      questions: 14,
    },

    "196753": {
      requiredPlan: "free",
      title: "Sleeping on the Job",
      examType: "real",
      part: 1,
      difficulty: "easy",
      minutes: 20,
      questions: 13,
    },
    "196736": {
      requiredPlan: "free",
      title: "Reducing the Effects of Jet Lag",
      examType: "real",
      part: 2,
      difficulty: "medium",
      minutes: 25,
      questions: 16,
    },
    "863456": {
      requiredPlan: "free",
      title: "Conscious and Unconscious Thought",
      examType: "real",
      part: 3,
      difficulty: "medium",
      minutes: 20,
      questions: 13,
    },
    "582943": {
      requiredPlan: "free",
      title: "The Growing Industry of Background Music",
      examType: "real",
      part: 2,
      difficulty: "medium",
      minutes: 20,
      questions: 13,
    },
    "146963": {
      requiredPlan: "free",
      title: "Native Species That Become Pests",
      examType: "real",
      part: 1,
      difficulty: "easy",
      minutes: 20,
      questions: 13,
    },
    "483129": {
      requiredPlan: "free",
      title: "Herding",
      examType: "real",
      part: 1,
      difficulty: "easy",
      minutes: 20,
      questions: 13,
    },
  },
  listening: {
    "846376": {
      requiredPlan: "free",
      title: "Listening Full Test 1",
      examType: "real",
      part: "full",
      difficulty: "medium",
      minutes: 30,
      questions: 40,
    },
    "326963": {
      requiredPlan: "free",
      title: "Listening Full Test 2",
      examType: "real",
      part: "full",
      difficulty: "medium",
      minutes: 30,
      questions: 40,
    },
    "876362": {
      requiredPlan: "free",
      title: "Listening Full Test 3",
      examType: "real",
      part: "full",
      difficulty: "medium",
      minutes: 32,
      questions: 40,
    },
  },
  writing: {},
  mock: {},
};

export function normalizePlan(value: unknown): UserPlan {
  const v = String(value ?? "").toLowerCase();
  if (!v || v === "free") return "free";
  return "premium";
}

export function planRank(plan: UserPlan): number {
  if (plan === "premium") return 1;
  return 0;
}

export function isPlanSufficient(userPlan: UserPlan, requiredPlan: UserPlan): boolean {
  return planRank(userPlan) >= planRank(requiredPlan);
}
