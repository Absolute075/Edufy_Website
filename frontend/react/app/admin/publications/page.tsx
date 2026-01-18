"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "../useAdminAuth";

type PublicationBlock = { title: string; items: string[] };

type Publication = {
  id: string;
  type: "changelog";
  title: string;
  date: string;
  imageUrl?: string;
  blocks: PublicationBlock[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

function blocksToText(blocks: PublicationBlock[]): string {
  return blocks
    .map((b) => {
      const lines = [b.title, ...b.items.map((x) => `- ${x}`)];
      return lines.join("\n");
    })
    .join("\n\n");
}

function textToBlocks(input: string): PublicationBlock[] {
  const chunks = String(input || "")
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);

  const blocks: PublicationBlock[] = [];
  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const title = String(lines[0] || "").trim();
    const items = lines
      .slice(1)
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    if (title && items.length) {
      blocks.push({ title, items });
    }
  }
  return blocks;
}

export default function AdminPublicationsPage() {
  const { info, loading, error } = useAdminAuth();

  const [items, setItems] = useState<Publication[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [blocksText, setBlocksText] = useState("New Features\n- ...\n\nBug Fixes\n- ...");
  const [saving, setSaving] = useState(false);

  const selected = useMemo(() => items.find((x) => x.id === editingId) || null, [items, editingId]);

  async function reload() {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch("/api/admin/publications?type=changelog", { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error(`load_failed_${res.status}`);
      const data: any = await res.json().catch(() => null);
      const pubs: Publication[] = Array.isArray(data?.publications) ? data.publications : [];
      setItems(pubs);
    } catch (e: any) {
      setListError(String(e?.message || e || "Failed to load"));
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    if (!loading && !error) {
      reload();
    }
  }, [loading, error]);

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title);
    setDate(selected.date);
    setImageUrl(selected.imageUrl || "");
    setPublished(!!selected.published);
    setBlocksText(blocksToText(selected.blocks));
  }, [selected]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDate("");
    setImageUrl("");
    setPublished(false);
    setBlocksText("New Features\n- ...\n\nBug Fixes\n- ...");
  }

  async function save() {
    const blocks = textToBlocks(blocksText);
    if (!title.trim() || !date.trim() || blocks.length === 0) {
      setListError("Fill title, date and blocks.");
      return;
    }

    setSaving(true);
    setListError(null);

    try {
      const payload: any = {
        type: "changelog",
        title: title.trim(),
        date: date.trim(),
        imageUrl: imageUrl.trim() || undefined,
        published,
        blocks,
      };

      const res = editingId
        ? await fetch("/api/admin/publications", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...payload, id: editingId }),
            credentials: "include",
          })
        : await fetch("/api/admin/publications", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include",
          });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `save_failed_${res.status}`);
      }

      await reload();
      resetForm();
    } catch (e: any) {
      setListError(String(e?.message || e || "Save failed").slice(0, 200));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!id) return;
    setSaving(true);
    setListError(null);
    try {
      const res = await fetch(`/api/admin/publications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`delete_failed_${res.status}`);
      await reload();
      if (editingId === id) resetForm();
    } catch (e: any) {
      setListError(String(e?.message || e || "Delete failed").slice(0, 200));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-300">Loading admin...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[0.2em] uppercase">Changelog Publications</h1>
          <p className="mt-2 text-sm text-gray-400">
            Signed in as <span className="font-mono text-gray-200">{info?.admin ?? "Unknown"}</span>
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors"
        >
          Back to admin
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.22em] text-gray-400">Publications</h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-[11px] uppercase tracking-[0.2em] text-gray-400 hover:text-white"
            >
              New
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {listLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-400">No publications yet.</p>
            ) : (
              items.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 cursor-pointer transition-colors ${
                    editingId === p.id
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 bg-black/20 hover:border-white/30"
                  }`}
                  onClick={() => setEditingId(p.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{p.title}</div>
                      <div className="mt-1 text-xs text-gray-400">
                        {p.date} {p.published ? "• published" : "• draft"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        remove(p.id);
                      }}
                      className="text-[11px] uppercase tracking-[0.2em] text-red-400 hover:text-red-300"
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {listError ? <p className="mt-4 text-xs text-red-400">{listError}</p> : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
          <h2 className="text-xs uppercase tracking-[0.22em] text-gray-400">Editor</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40"
                placeholder="Week Update"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Date (YYYY-MM-DD)</label>
                <input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40"
                  placeholder="2026-01-18"
                />
              </div>

              <div className="flex items-end gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                  />
                  Published
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Image URL (optional)</label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Blocks</label>
              <textarea
                value={blocksText}
                onChange={(e) => setBlocksText(e.target.value)}
                rows={14}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 font-mono"
              />
              <p className="mt-2 text-xs text-gray-500">
                Format: block title on first line, then "- item" lines. Separate blocks with an empty line.
              </p>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="w-full inline-flex justify-center rounded-full bg-white text-black px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
