"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { normalizePlan, type UserPlan } from "@/lib/resourcesRegistry";

function isoToDisplayDob(value: string | null | undefined): string {
  if (!value) return "";
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  return `${m[3]}/${m[2]}/${m[1]}`; // dd/mm/yyyy
}

export type UserProfileData = {
  username: string;
  email: string;
  phone: string;
  dobDisplay: string;
  avatarUrl: string;
  certificates: string[];
  favoriteSubject: string;
  dailyHours: string;
  plan: UserPlan;
};

export type UserProfileContextValue = {
  data: UserProfileData | null;
  loading: boolean; // true только пока нет ни одного успешного ответа
  revalidating: boolean; // фоновой refetch при уже имеющихся данных
  error: string | null;
  refresh: () => Promise<void>;
  patch: (partial: Partial<UserProfileData>) => void;
};

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [revalidating, setRevalidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  const load = useCallback(async () => {
    const hasData = !!data;
    if (!initialized && !hasData) {
      setLoading(true);
    } else {
      setRevalidating(true);
    }
    setError(null);

    try {
      let username = data?.username ?? "";
      let email = data?.email ?? "";
      let phone = data?.phone ?? "";
      let dobDisplay = data?.dobDisplay ?? "";
      let avatarUrl = data?.avatarUrl ?? "";
      let certificates = data?.certificates ?? [];
      let favoriteSubject = data?.favoriteSubject ?? "";
      let dailyHours = data?.dailyHours ?? "";
      let plan = data?.plan ?? "free";

      try {
        const resMe = await api("/auth/me");
        if (resMe.ok) {
          const me = await resMe.json();
          if (me) {
            if (me.username) username = me.username;
            if (me.email) email = me.email;
            const rawPlan =
              me.plan ??
              me.data?.plan ??
              me.user?.plan ??
              me.profile?.plan ??
              me.subscriptionPlan ??
              me.tariff;
            if (rawPlan !== undefined && rawPlan !== null && String(rawPlan).trim()) {
              plan = normalizePlan(rawPlan);
            }
          }
        }
      } catch {
        // ignore, сессия обрабатывается SessionExpiredProvider
      }

      try {
        const resProfile = await api("/user/profile");
        if (resProfile.ok) {
          const p = await resProfile.json();
          if (p) {
            const phoneVal = p.phone || phone;
            const dobVal = isoToDisplayDob(p.birthDate as string | null | undefined);
            const certVal = p.certificate || "";
            const favSubjVal = p.favorite_subject || "";
            const hoursVal = p.daily_hours || "";
            const rawPlan =
              p.plan ??
              p.data?.plan ??
              p.user?.plan ??
              p.profile?.plan ??
              p.subscriptionPlan ??
              p.tariff;
            const planVal =
              rawPlan !== undefined && rawPlan !== null && String(rawPlan).trim()
                ? normalizePlan(rawPlan)
                : plan;

            const certList = certVal
              ? String(certVal)
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : certificates;

            phone = phoneVal;
            dobDisplay = dobVal;
            avatarUrl = p.avatarUrl || avatarUrl;
            certificates = certList;
            favoriteSubject = favSubjVal || favoriteSubject;
            dailyHours = hoursVal || dailyHours;
            plan = planVal;
          }
        }
      } catch {
        // ignore, ошибка сессии уже обрабатывается глобально
      }

      const next: UserProfileData = {
        username: username || "",
        email: email || "",
        phone: phone || "",
        dobDisplay: dobDisplay || "",
        avatarUrl: avatarUrl || "",
        certificates: certificates || [],
        favoriteSubject: favoriteSubject || "",
        dailyHours: dailyHours || "",
        plan: normalizePlan(plan),
      };

      setData(next);
    } catch {
      if (!initialized) {
        setError("Failed to load profile");
      }
    } finally {
      setInitialized(true);
      setLoading(false);
      setRevalidating(false);
    }
  }, [data, initialized]);

  useEffect(() => {
    // Первый загрузочный запрос
    load();
  }, []);

  const patch = useCallback((partial: Partial<UserProfileData>) => {
    setData((prev) => {
      if (!prev) return { username: "", email: "", phone: "", dobDisplay: "", avatarUrl: "", certificates: [], favoriteSubject: "", dailyHours: "", plan: "free", ...partial };
      return { ...prev, ...partial };
    });
  }, []);

  const value: UserProfileContextValue = {
    data,
    loading: !initialized && loading,
    revalidating: initialized && revalidating,
    error,
    refresh: async () => {
      await load();
    },
    patch,
  };

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return ctx;
}
