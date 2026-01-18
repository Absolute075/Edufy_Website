import fs from "fs";
import path from "path";

export type PublicationType = "changelog";

export type Publication = {
  id: string;
  type: PublicationType;
  title: string;
  date: string;
  mediaUrls?: string[];
  contentHtml: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type PublicationsFile = {
  publications: Publication[];
};

const DATA_PATH = path.join(process.cwd(), "data", "publications.json");

function safeParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function legacyBlocksToHtml(blocks: any): string {
  if (!Array.isArray(blocks)) return "";
  const normalized = blocks
    .map((b) => {
      const title = String(b?.title || "").trim();
      const items: string[] = Array.isArray(b?.items)
        ? b.items.map((x: unknown) => String(x || "").trim()).filter(Boolean)
        : [];
      return { title, items };
    })
    .filter((b) => b.title || b.items.length);

  if (!normalized.length) return "";

  return normalized
    .map((b) => {
      const header = b.title ? `<h3>${escapeHtml(b.title)}</h3>` : "";
      const list = b.items.length
        ? `<ul>${b.items.map((x: string) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
        : "";
      return `${header}${list}`;
    })
    .join("");
}

function normalizePublication(input: any): Publication {
  const id = String(input?.id || "");
  const type = (String(input?.type || "changelog") === "changelog" ? "changelog" : "changelog") as PublicationType;
  const title = String(input?.title || "");
  const date = String(input?.date || "");

  const legacyImageUrl = String(input?.imageUrl || "").trim();
  const mediaUrls = Array.isArray(input?.mediaUrls)
    ? input.mediaUrls.map((x: any) => String(x || "").trim()).filter(Boolean).slice(0, 5)
    : legacyImageUrl
      ? [legacyImageUrl]
      : undefined;

  const contentHtmlRaw = String(input?.contentHtml || "");
  const contentHtml = contentHtmlRaw.trim() ? contentHtmlRaw : legacyBlocksToHtml(input?.blocks);

  const published = Boolean(input?.published);
  const createdAt = String(input?.createdAt || "");
  const updatedAt = String(input?.updatedAt || "");

  return {
    id,
    type,
    title,
    date,
    mediaUrls: mediaUrls && mediaUrls.length ? mediaUrls : undefined,
    contentHtml: contentHtml || "",
    published,
    createdAt,
    updatedAt,
  };
}

export function readPublicationsFile(): PublicationsFile {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const parsed = safeParseJson(raw);
    if (parsed && Array.isArray(parsed.publications)) {
      return { publications: parsed.publications.map(normalizePublication) };
    }
  } catch {}
  return { publications: [] };
}

export function writePublicationsFile(data: PublicationsFile) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  const tmp = `${DATA_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, DATA_PATH);
}

export function listPublications(type?: PublicationType, onlyPublished?: boolean): Publication[] {
  const { publications } = readPublicationsFile();
  return publications
    .filter((p) => (type ? p.type === type : true))
    .filter((p) => (onlyPublished ? !!p.published : true))
    .sort((a, b) => {
      const d = String(b.date).localeCompare(String(a.date));
      if (d !== 0) return d;
      const bt = String(b.updatedAt || b.createdAt || "");
      const at = String(a.updatedAt || a.createdAt || "");
      const t = bt.localeCompare(at);
      if (t !== 0) return t;
      return String(b.id).localeCompare(String(a.id));
    });
}
