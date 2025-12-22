import type { ResourceCategory } from "./resourcesRegistry";

const STORAGE_KEY = "edufy.completedTests.v1";

type CompletedTestsState = Partial<Record<ResourceCategory, Record<string, number>>>;

function safeParse(value: string | null): CompletedTestsState {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as CompletedTestsState;
  } catch {
    return {};
  }
}

export function getCompletedTestsState(): CompletedTestsState {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function getCompletedTestIds(category: ResourceCategory): string[] {
  const state = getCompletedTestsState();
  return Object.keys(state[category] ?? {});
}

export function isTestCompleted(category: ResourceCategory, id: string): boolean {
  const state = getCompletedTestsState();
  return Boolean(state[category]?.[id]);
}

export function markTestCompleted(category: ResourceCategory, id: string): void {
  if (typeof window === "undefined") return;
  const state = getCompletedTestsState();
  const byCategory = { ...(state[category] ?? {}) };
  byCategory[id] = Date.now();
  const nextState: CompletedTestsState = { ...state, [category]: byCategory };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

export function clearTestCompleted(category: ResourceCategory, id: string): void {
  if (typeof window === "undefined") return;
  const state = getCompletedTestsState();
  const byCategory = { ...(state[category] ?? {}) };
  delete byCategory[id];
  const nextState: CompletedTestsState = { ...state, [category]: byCategory };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}
