import { NextResponse } from "next/server";
import { listPublications, type PublicationType } from "@/lib/publicationsStore";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const typeRaw = String(url.searchParams.get("type") || "").trim();
  const type = (typeRaw === "changelog" ? "changelog" : undefined) as PublicationType | undefined;

  const publications = listPublications(type, true);
  return NextResponse.json({ publications }, { status: 200 });
}
