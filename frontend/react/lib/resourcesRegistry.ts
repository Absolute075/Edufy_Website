export type UserPlan = "free" | "plus" | "premium";
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
  },
  writing: {},
  mock: {},
};

export function normalizePlan(value: unknown): UserPlan {
  const v = String(value ?? "").toLowerCase();
  if (v === "premium" || v === "pro") return "premium";
  if (v === "plus") return "plus";
  return "free";
}

export function planRank(plan: UserPlan): number {
  if (plan === "premium") return 2;
  if (plan === "plus") return 1;
  return 0;
}

export function isPlanSufficient(userPlan: UserPlan, requiredPlan: UserPlan): boolean {
  return planRank(userPlan) >= planRank(requiredPlan);
}
