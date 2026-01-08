"use client";

import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { isPlanSufficient } from "@/lib/resourcesRegistry";
import { videoResourcesRegistry } from "@/lib/videoResourcesRegistry";
import { useUserProfile } from "../../../UserProfileProvider";

export default function LessonsReportsWatchPage() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const id = (searchParams.get("id") || "").trim();

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const { data: profileData } = useUserProfile();
  const userPlan = profileData?.plan ?? "free";

  const item = useMemo(() => {
    if (!id) return null;
    const rule = videoResourcesRegistry[id];
    if (!rule) return null;
    return { id, ...rule };
  }, [id]);

  const locked = item ? !isPlanSufficient(userPlan, item.requiredPlan) : false;

  useEffect(() => {
    if (!id) return;
    if (!item) return;
    if (!locked) return;

    const redirectUrl = `${userPrefix}/resources/lessons-reports/watch?id=${encodeURIComponent(id)}`;
    router.replace(`${userPrefix}/billing?redirect=${encodeURIComponent(redirectUrl)}`);
  }, [id, item, locked, router, userPrefix]);

  if (!id) {
    notFound();
  }

  if (!item) {
    notFound();
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">{item.title}</h1>
          <p className="text-sm text-slate-400">
            {item.section} · {item.mediaType} · {item.requiredPlan}
          </p>
        </div>

        {locked ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-6 text-sm text-slate-400">
            Redirecting to billing...
          </div>
        ) : item.mediaType === "video" ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
            <video
              className="w-full rounded-xl"
              controls
              preload="metadata"
              src={item.href}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-neutral-700 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition-colors hover:bg-white/90"
            >
              Download
            </a>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
