import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DictionaryApiMeaning = {
  partOfSpeech?: string;
  definitions?: Array<{
    definition?: string;
    example?: string;
  }>;
};

type DictionaryApiEntry = {
  word?: string;
  phonetic?: string;
  meanings?: DictionaryApiMeaning[];
};

function pickDefinitions(payload: unknown) {
  const arr = Array.isArray(payload) ? (payload as DictionaryApiEntry[]) : [];
  const first = arr[0];

  const word = String(first?.word || "").trim();
  const phonetic = String(first?.phonetic || "").trim() || undefined;

  const meaningsRaw = Array.isArray(first?.meanings) ? first?.meanings : [];
  const meanings = meaningsRaw
    .map((m) => {
      const partOfSpeech = String(m?.partOfSpeech || "").trim() || undefined;
      const defsRaw = Array.isArray(m?.definitions) ? m?.definitions : [];
      const definitions = defsRaw
        .map((d) => {
          const definition = String(d?.definition || "").trim();
          const example = String(d?.example || "").trim();
          if (!definition) return null;
          return { definition, example: example || undefined };
        })
        .filter(Boolean)
        .slice(0, 4) as Array<{ definition: string; example?: string }>;

      if (!definitions.length) return null;
      return { partOfSpeech, definitions };
    })
    .filter(Boolean)
    .slice(0, 6) as Array<{ partOfSpeech?: string; definitions: Array<{ definition: string; example?: string }> }>;

  return { word: word || undefined, phonetic, meanings };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wordRaw = String(url.searchParams.get("word") || "").trim();

  const word = wordRaw.replace(/[^a-zA-Z\-\s']/g, "").trim();
  if (!word) {
    return NextResponse.json(
      { ok: false, error: "missing_word" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }

  const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

  try {
    const res = await fetch(dictUrl, {
      cache: "no-store",
      headers: { "accept": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, word, error: `not_found_${res.status}` },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    const payload = await res.json().catch(() => null);
    const picked = pickDefinitions(payload);

    return NextResponse.json(
      {
        ok: true,
        word: picked.word ?? word,
        phonetic: picked.phonetic,
        meanings: picked.meanings,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, word, error: String(e?.message || e || "fetch_failed").slice(0, 200) },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}
