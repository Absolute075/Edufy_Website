"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "../useAdminAuth";

type Publication = {
  id: string;
  type: "changelog";
  title: string;
  date: string;
  mediaUrls?: string[];
  contentHtml: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

function clampMediaUrls(input: string[]): string[] {
  return input.map((x) => x.trim()).filter(Boolean).slice(0, 5);
}

function applyWrapTag(tag: "strong" | "em" | "u" | "s" | "code" | "span", attrs?: Record<string, string>) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
  }

  try {
    range.surroundContents(el);
    selection.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    selection.addRange(r);
  } catch {
    const html = range.extractContents();
    el.appendChild(html);
    range.insertNode(el);
  }
}

export default function AdminPublicationsPage() {
  const { info, loading, error } = useAdminAuth();

  const [items, setItems] = useState<Publication[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([""]);
  const [published, setPublished] = useState(false);
  const [contentHtml, setContentHtml] = useState(
    "<h3>New Features</h3><ul><li>...</li></ul><h3>Bug Fixes</h3><ul><li>...</li></ul>"
  );
  const [saving, setSaving] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);

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
    setMediaUrls(selected.mediaUrls?.length ? [...selected.mediaUrls, ""] : [""]);
    setPublished(!!selected.published);
    setContentHtml(selected.contentHtml || "");
  }, [selected]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDate("");
    setMediaUrls([""]);
    setPublished(false);
    setContentHtml("<h3>New Features</h3><ul><li>...</li></ul><h3>Bug Fixes</h3><ul><li>...</li></ul>");
  }

  async function save() {
    const html = (editorRef.current?.innerHTML ?? contentHtml).trim();
    const urls = clampMediaUrls(mediaUrls);
    if (!title.trim() || !date.trim() || !html) {
      setListError("Fill title, date and content.");
      return;
    }

    setSaving(true);
    setListError(null);

    try {
      const payload: any = {
        type: "changelog",
        title: title.trim(),
        date: date.trim(),
        mediaUrls: urls.length ? urls : undefined,
        published,
        contentHtml: html,
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
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
                Media (photo/gif URLs, up to 5)
              </label>
              <div className="space-y-2">
                {mediaUrls.slice(0, 5).map((value, idx) => (
                  <input
                    key={idx}
                    value={value}
                    onChange={(e) => {
                      const next = [...mediaUrls];
                      next[idx] = e.target.value;
                      if (idx === next.length - 1 && e.target.value.trim()) {
                        next.push("");
                      }
                      setMediaUrls(next.slice(0, 6));
                    }}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40"
                    placeholder={idx === 0 ? "https://..." : "(optional) https://..."}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">All media will appear above the update on /changelog.</p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Update content</label>

              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => applyWrapTag("strong")}
                  className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:border-white/40"
                >
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => applyWrapTag("span", { style: "font-family: cursive" })}
                  className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:border-white/40"
                >
                  Cursive
                </button>
                <button
                  type="button"
                  onClick={() => applyWrapTag("em")}
                  className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:border-white/40"
                >
                  Italic
                </button>
                <button
                  type="button"
                  onClick={() => applyWrapTag("u")}
                  className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:border-white/40"
                >
                  Underline
                </button>
                <button
                  type="button"
                  onClick={() => applyWrapTag("s")}
                  className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:border-white/40"
                >
                  Strikethrough
                </button>
                <button
                  type="button"
                  onClick={() => applyWrapTag("code")}
                  className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:border-white/40"
                >
                  Monospace
                </button>
              </div>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setContentHtml((e.currentTarget as HTMLDivElement).innerHTML)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white focus:outline-none focus:border-white/40 min-h-[260px]"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
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
