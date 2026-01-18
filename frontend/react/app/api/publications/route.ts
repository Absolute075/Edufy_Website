import { NextResponse } from "next/server";
import { listPublications, type PublicationType } from "@/lib/publicationsStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const typeRaw = String(url.searchParams.get("type") || "").trim();
  const type = (typeRaw === "changelog" ? "changelog" : undefined) as PublicationType | undefined;

  const publications = listPublications(type, true);
  return NextResponse.json(
    { publications },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
        Vary: "*",
      },
    }
  );
}
