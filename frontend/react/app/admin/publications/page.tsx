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

function applyWrapTag(
  tag: "strong" | "em" | "u" | "s" | "code" | "span",
  range: Range,
  attrs?: Record<string, string>
) {
  if (!range || range.collapsed) return;

  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
  }

  try {
    range.surroundContents(el);
  } catch {
    const html = range.extractContents();
    el.appendChild(html);
    range.insertNode(el);
  }
}

function applyLink(range: Range, href: string) {
  const url = String(href || "").trim();
  if (!range || range.collapsed || !url) return;

  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("target", "_blank");
  a.setAttribute("rel", "noopener noreferrer");

  try {
    range.surroundContents(a);
  } catch {
    const html = range.extractContents();
    a.appendChild(html);
    range.insertNode(a);
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
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [contentHtml, setContentHtml] = useState(
    "<h3>New Features</h3><ul><li>...</li></ul><h3>Bug Fixes</h3><ul><li>...</li></ul>"
  );
  const [saving, setSaving] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastRangeRef = useRef<Range | null>(null);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const [toolbar, setToolbar] = useState<{ visible: boolean; top: number; left: number }>({
    visible: false,
    top: 0,
    left: 0,
  });

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
    setMediaUrls(Array.isArray(selected.mediaUrls) ? selected.mediaUrls.slice(0, 5) : []);
    setPublished(!!selected.published);
    setContentHtml(selected.contentHtml || "");

    if (editorRef.current) {
      editorRef.current.innerHTML = selected.contentHtml || "";
    }
  }, [selected]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDate("");
    setMediaUrls([]);
    setPublished(false);
    setContentHtml("<h3>New Features</h3><ul><li>...</li></ul><h3>Bug Fixes</h3><ul><li>...</li></ul>");

    if (editorRef.current) {
      editorRef.current.innerHTML = "<h3>New Features</h3><ul><li>...</li></ul><h3>Bug Fixes</h3><ul><li>...</li></ul>";
    }
  }

  function syncEditorHtmlToState() {
    const html = editorRef.current?.innerHTML ?? "";
    setContentHtml(html);
  }

  function captureSelection() {
    const ed = editorRef.current;
    const selection = window.getSelection();
    if (!ed || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      return;
    }

    const anchorNode = selection.anchorNode;
    if (!anchorNode || !ed.contains(anchorNode)) {
      return;
    }

    try {
      lastRangeRef.current = range.cloneRange();
    } catch {
      lastRangeRef.current = null;
    }
  }

  function restoreSelection() {
    const r = lastRangeRef.current;
    if (!r) return null;
    const sel = window.getSelection();
    if (!sel) return null;
    sel.removeAllRanges();
    sel.addRange(r);
    return r;
  }

  useEffect(() => {
    function onSelectionChange() {
      captureSelection();
    }
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, []);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) {
        setToolbar((t) => (t.visible ? { ...t, visible: false } : t));
        return;
      }
      if (editorRef.current && editorRef.current.contains(target)) return;
      setToolbar((t) => (t.visible ? { ...t, visible: false } : t));
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setToolbar((t) => (t.visible ? { ...t, visible: false } : t));
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function handleEditorContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    captureSelection();

    const ed = editorRef.current;
    const selection = window.getSelection();
    if (!ed || !selection || selection.rangeCount === 0) {
      setToolbar((t) => (t.visible ? { ...t, visible: false } : t));
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      setToolbar((t) => (t.visible ? { ...t, visible: false } : t));
      return;
    }

    const anchorNode = selection.anchorNode;
    if (!anchorNode || !ed.contains(anchorNode)) {
      setToolbar((t) => (t.visible ? { ...t, visible: false } : t));
      return;
    }

    const padding = 8;
    const top = Math.max(padding, e.clientY);
    const left = Math.max(padding, e.clientX);
    setToolbar({ visible: true, top, left });
  }

  async function handleMediaFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = 5 - mediaUrls.length;
    if (remaining <= 0) return;

    const slice = Array.from(files).slice(0, remaining);

    setSaving(true);
    setListError(null);
    try {
      for (const file of slice) {
        const formData = new FormData();
        formData.append("file", file, file.name);

        const res = await fetch("/api/admin/publications/media", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const body: any = await res.json().catch(() => null);
        if (!res.ok || !body?.url) {
          throw new Error("Upload failed");
        }

        setMediaUrls((prev) => clampMediaUrls([...prev, String(body.url)]));
      }
    } catch (e: any) {
      setListError(String(e?.message || e || "Upload failed").slice(0, 200));
    } finally {
      setSaving(false);
    }
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
                  Show on site
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Media (photo/gif, up to 5)</label>

              <div className="flex items-center justify-between gap-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleMediaFilesSelected(e.target.files)}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black hover:file:bg-gray-100"
                />
              </div>

              {mediaUrls.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {mediaUrls.map((src) => (
                    <div key={src} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      <img src={src} alt="media" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setMediaUrls((prev) => prev.filter((x) => x !== src))}
                        className="absolute top-2 right-2 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:border-white/40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <p className="mt-2 text-xs text-gray-500">Media will appear above the update on /changelog.</p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Update content</label>

              {toolbar.visible ? (
                <div
                  className="fixed z-50 flex items-center gap-2 rounded-full border border-white/15 bg-black/80 px-3 py-2 backdrop-blur-md"
                  style={{
                    top: toolbar.top,
                    left: toolbar.left,
                    transform: "translateY(-100%)",
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const r = restoreSelection();
                      if (r) applyWrapTag("strong", r);
                      syncEditorHtmlToState();
                      captureSelection();
                    }}
                    className="text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:text-white"
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const r = restoreSelection();
                      if (r) applyWrapTag("span", r, { style: "font-family: cursive" });
                      syncEditorHtmlToState();
                      captureSelection();
                    }}
                    className="text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:text-white"
                  >
                    Cursive
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const r = restoreSelection();
                      if (r) applyWrapTag("u", r);
                      syncEditorHtmlToState();
                      captureSelection();
                    }}
                    className="text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:text-white"
                  >
                    Underline
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const r = restoreSelection();
                      if (r) applyWrapTag("s", r);
                      syncEditorHtmlToState();
                      captureSelection();
                    }}
                    className="text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:text-white"
                  >
                    Strike
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const r = restoreSelection();
                      if (r) applyWrapTag("code", r);
                      syncEditorHtmlToState();
                      captureSelection();
                    }}
                    className="text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:text-white"
                  >
                    Mono
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setLinkUrl("");
                      setLinkModalOpen(true);
                    }}
                    className="text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:text-white"
                  >
                    Link
                  </button>
                </div>
              ) : null}

              <div
                ref={editorRef}
                contentEditable
                dir="ltr"
                suppressContentEditableWarning
                onInput={(e) => setContentHtml((e.currentTarget as HTMLDivElement).innerHTML)}
                onContextMenu={handleEditorContextMenu}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white focus:outline-none focus:border-white/40 min-h-[260px] text-left"
                style={{ direction: "ltr", textAlign: "left", unicodeBidi: "plaintext" }}
              />
            </div>

            {linkModalOpen ? (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4" onMouseDown={() => setLinkModalOpen(false)}>
                <div
                  className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/90 p-5"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="text-sm font-semibold text-white">Create link</div>
                  <div className="mt-3">
                    <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">URL</label>
                    <input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40"
                      autoFocus
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setLinkModalOpen(false)}
                      className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-gray-200 hover:border-white/40"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const r = restoreSelection();
                        if (r) {
                          applyLink(r, linkUrl);
                          syncEditorHtmlToState();
                          captureSelection();
                        }
                        setLinkModalOpen(false);
                      }}
                      className="rounded-full bg-white px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-black hover:bg-gray-100"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

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
