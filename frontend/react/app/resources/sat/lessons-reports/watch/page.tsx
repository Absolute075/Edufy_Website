"use client";

import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { isPlanSufficient } from "@/lib/resourcesRegistry";
import { satVideoResourcesRegistry } from "@/lib/satVideoResourcesRegistry";
import { useUserProfile } from "../../../../UserProfileProvider";

export default function SatLessonsReportsWatchPage() {
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
    const rule = satVideoResourcesRegistry[id];
    if (!rule) return null;
    return { id, ...rule };
  }, [id]);

  const locked = item ? !isPlanSufficient(userPlan, item.requiredPlan) : false;

  useEffect(() => {
    if (!id) return;
    if (!item) return;
    if (!locked) return;

    const redirectUrl = `${userPrefix}/resources/sat/lessons-reports/watch?id=${encodeURIComponent(id)}`;
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
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold">{item.title}</h1>
            {item.telegramHref ? (
              <a
                href={item.telegramHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950/60 text-slate-200 transition-colors hover:bg-neutral-900 hover:text-white"
                aria-label="Open Telegram"
                title="Telegram"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M21.7 4.3c.5-2-1.3-3.2-3.2-2.5L3.8 7.6c-2 .8-1.9 2.1-.4 2.6l3.8 1.2 1.5 4.8c.2.6.1.9.7.9.5 0 .7-.2 1-.5l2-1.9 4.2 3.1c.8.4 1.3.2 1.5-.7l3.6-16.1zM8.1 11l10.6-6.7c.5-.3.9-.1.6.2L10.4 12c-.3.3-.6.6-.6 1l-.2 2.2-.6-2c-.1-.4-.4-.7-.9-.8L5.3 10.7c-.5-.2-.5-.6.1-.8l13-5c.5-.2.9 0 .7.6L15.8 17c-.1.5-.4.6-.8.4l-4.7-3.5c-.3-.2-.3-.5 0-.7l8.6-8.2c.2-.2 0-.3-.2-.2l-10.6 6.2z"
                    className="fill-current"
                  />
                </svg>
              </a>
            ) : null}
          </div>
          <p className="text-sm text-slate-400">
            SAT · {item.section} · {item.mediaType} · {item.requiredPlan}
          </p>
        </div>

        {locked ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-6 text-sm text-slate-400">
            Redirecting to billing...
          </div>
        ) : item.mediaType === "video" ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
            {item.href ? (
              <video className="block w-full rounded-xl" src={item.href} controls preload="metadata" />
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 text-sm text-slate-400">
                Video URL is missing.
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-neutral-700 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition-colors hover:bg-white/90"
              >
                Download
              </a>
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 text-sm text-slate-400">
                File URL is missing.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
