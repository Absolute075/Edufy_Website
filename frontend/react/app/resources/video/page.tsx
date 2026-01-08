"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VideoResourcesPage() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    const first = parts[0] || "";
    const hasUser = /^\d+$/.test(first);
    const prefix = hasUser ? `/${first}` : "";
    router.replace(`${prefix}/resources/lessons-reports`);
  }, [pathname, router]);

  return null;
}
