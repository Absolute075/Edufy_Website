import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Changelog | Edufy",
  description: "Latest updates and changes for Edufy.",
};

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
