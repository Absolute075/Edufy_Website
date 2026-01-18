import fs from "fs";
import path from "path";

export type PublicationType = "changelog";

export type PublicationBlock = {
  title: string;
  items: string[];
};

export type Publication = {
  id: string;
  type: PublicationType;
  title: string;
  date: string;
  imageUrl?: string;
  blocks: PublicationBlock[];
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

export function readPublicationsFile(): PublicationsFile {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const parsed = safeParseJson(raw);
    if (parsed && Array.isArray(parsed.publications)) {
      return { publications: parsed.publications as Publication[] };
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
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
