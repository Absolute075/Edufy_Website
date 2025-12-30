import type { ResourceCategory } from "./resourcesRegistry";

const BASE_STORAGE_KEY = "edufy.completedTests.v1";

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

function getUserKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const key =
      (window as any).__edufyUserKey ||
      window.sessionStorage.getItem("edufy.user.key") ||
      window.localStorage.getItem("edufy.user.key");
    const normalized = key ? String(key).trim() : "";
    return normalized ? normalized : null;
  } catch {
    return null;
  }
}

function getStorageKey(): string {
  const userKey = getUserKey();
  return userKey ? `${BASE_STORAGE_KEY}.${userKey}` : BASE_STORAGE_KEY;
}

function maybeMigrateLegacyState(): void {
  if (typeof window === "undefined") return;
  const userKey = getUserKey();
  if (!userKey) return;

  const scopedKey = `${BASE_STORAGE_KEY}.${userKey}`;
  try {
    const hasScoped = window.localStorage.getItem(scopedKey);
    if (hasScoped != null) return;

    const legacy = window.localStorage.getItem(BASE_STORAGE_KEY);
    if (!legacy) return;
    window.localStorage.setItem(scopedKey, legacy);
  } catch {
    // ignore
  }
}

export function getCompletedTestsState(): CompletedTestsState {
  if (typeof window === "undefined") return {};
  maybeMigrateLegacyState();
  return safeParse(window.localStorage.getItem(getStorageKey()));
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
  window.localStorage.setItem(getStorageKey(), JSON.stringify(nextState));
}

export function clearTestCompleted(category: ResourceCategory, id: string): void {
  if (typeof window === "undefined") return;
  const state = getCompletedTestsState();
  const byCategory = { ...(state[category] ?? {}) };
  delete byCategory[id];
  const nextState: CompletedTestsState = { ...state, [category]: byCategory };
  window.localStorage.setItem(getStorageKey(), JSON.stringify(nextState));
}
