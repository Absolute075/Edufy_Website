export type UserPlan = "free" | "plus" | "premium";
export type ResourceCategory = "reading" | "listening" | "writing" | "mock";

export type ResourceDifficulty = "easy" | "medium" | "hard";

export type ResourceExamType = "real" | "cambridge";

export type ResourceRule = {
  requiredPlan: UserPlan;
  title: string;
  examType: ResourceExamType;
  part: 1 | 2 | 3 | 4;
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
    "976485": {
      requiredPlan: "free",
      title: "The tuatara – past and future",
      examType: "real",
      part: 3,
      difficulty: "medium",
      minutes: 20,
      questions: 12,
    },
  },
  listening: {
    "846376": {
      requiredPlan: "free",
      title: "IELTS Listening Full Test",
      examType: "real",
      part: 4,
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
