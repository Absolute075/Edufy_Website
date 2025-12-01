"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        try {
          const resMe = await api("/auth/me");
          if (resMe.ok) {
            const me = await resMe.json();
            if (!cancelled) {
              setUsername(me.username || "");
              setEmail(me.email || "");
            }
          }
        } catch {
          // ignore, error handled by session modal if 401
        }

        try {
          const resProfile = await api("/user/profile");
          if (resProfile.ok) {
            const p = await resProfile.json();
            if (!cancelled) {
              setPhone(p.phone || "");
              if (p.birthDate) setDob(String(p.birthDate));
            }
          }
        } catch {
          // ignore, error handled by session modal if 401
        }
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load profile");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let ok = true;

      const newUsername = username.trim();
      const newPhone = phone.trim();

      {
        const body: Record<string, string> = {};
        if (newUsername) body.username = newUsername;
        if (newPhone) body.phone = newPhone;
        if (Object.keys(body).length > 0) {
          const r1 = await api("/auth/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          ok = ok && r1.ok;
        }
      }

      const r2 = await api("/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate: dob || "", phone: newPhone || "" }),
      });
      ok = ok && r2.ok;

      if (ok) {
        setSuccess("Changes saved successfully!");
      } else {
        setError("Failed to save changes");
      }
    } catch (e) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  const headerName = username || "Student";

  return (
    <DashboardShell studentName={headerName}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-slate-400">
            Manage your personal information used across Edufy services.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg shadow-black/30">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-700 bg-slate-900">
                <img
                  src="https://resources.edufyuzbekistan.com/storage/images/10d554ea6f330f1612526b54562c8a33.jpg"
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-100">{headerName}</div>
                <div className="text-xs text-slate-400">Learning to achieve excellence</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Username
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading || saving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email address
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
              <p className="text-xs text-slate-500">Email is managed via your Edufy account.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Phone number (optional)
              </label>
              <input
                type="tel"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading || saving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Date of birth (optional)
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={loading || saving}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-xs">
              {loading && <p className="text-slate-400">Loading profile...</p>}
              {error && <p className="text-red-400">{error}</p>}
              {success && <p className="text-emerald-400">{success}</p>}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saving}
              className="inline-flex items-center justify-center rounded-lg border border-cyan-500 bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 disabled:opacity-60"
           >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
