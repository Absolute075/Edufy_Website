"use client";

import { useEffect, useState, useRef, ChangeEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { usePageTitle } from "../lib/usePageTitle";

const DEFAULT_AVATAR_URL =
  "https://resources.edufyuzbekistan.com/storage/images/10d554ea6f330f1612526b54562c8a33.jpg";

function isoToDisplayDob(value: string | null | undefined): string {
  if (!value) return "";
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  return `${m[3]}/${m[2]}/${m[1]}`; // dd/mm/yyyy
}

function displayToIsoDob(value: string | null | undefined): string {
  if (!value) return "";
  const s = String(value).trim();
  if (!s) return "";
  const m = s.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function formatDobInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function ProfilePage() {
  usePageTitle("Edufy – Profile");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [certificate, setCertificate] = useState("");
  const [favoriteSubject, setFavoriteSubject] = useState("");
  const [dailyHours, setDailyHours] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const initialUsernameRef = useRef<string>("");
  const initialPhoneRef = useRef<string>("");
  const initialDobRef = useRef<string>("");
  const initialCertificateRef = useRef<string>("");
  const initialFavoriteSubjectRef = useRef<string>("");
  const initialDailyHoursRef = useRef<string>("");

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
              const u = me.username || "";
              setUsername(u);
              setEmail(me.email || "");
              initialUsernameRef.current = u;
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
              const phoneVal = p.phone || "";
              const dobVal = isoToDisplayDob(p.birthDate as string | null | undefined);
              const certVal = p.certificate || "";
              const favSubjVal = p.favorite_subject || "";
              const hoursVal = p.daily_hours || "";

              setPhone(phoneVal);
              setDob(dobVal);
              if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
              setCertificate(certVal);
              setFavoriteSubject(favSubjVal);
              setDailyHours(hoursVal);

              initialPhoneRef.current = phoneVal;
              initialDobRef.current = dobVal;
              initialCertificateRef.current = certVal;
              initialFavoriteSubjectRef.current = favSubjVal;
              initialDailyHoursRef.current = hoursVal;
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

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (!success) return;
    const id = window.setTimeout(() => {
      setSuccess(null);
    }, 3000);
    return () => window.clearTimeout(id);
  }, [success]);

  function handleAvatarButtonClick() {
    if (avatarUploading || loading || saving || !editMode) return;
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!editMode) {
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      e.target.value = "";
      return;
    }

    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const res = await api("/user/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        setError("Failed to upload avatar");
        return;
      }
      const body = await res.json();
      if (body && body.avatarUrl) {
        setAvatarUrl(body.avatarUrl);
        setSuccess("Avatar updated");
      } else {
        setError("Failed to upload avatar");
      }
    } catch {
      setError("Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  }

  function handleStartEdit() {
    if (loading || saving) return;
    setError(null);
    setSuccess(null);
    setEditMode(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let ok = true;

      const newUsername = username.trim();
      const newPhone = phone.trim();

      const hasProfileChanges =
        newUsername !== (initialUsernameRef.current || "").trim() ||
        newPhone !== (initialPhoneRef.current || "").trim() ||
        (dob || "") !== (initialDobRef.current || "");

      const hasPreferenceChanges =
        (certificate || "") !== (initialCertificateRef.current || "") ||
        (favoriteSubject || "") !== (initialFavoriteSubjectRef.current || "") ||
        (dailyHours || "") !== (initialDailyHoursRef.current || "");

      // If nothing changed, still treat as successful save without hitting backend
      if (!hasProfileChanges && !hasPreferenceChanges) {
        setSuccess("Changes saved successfully!");
        setEditMode(false);
        return;
      }

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

      const isoDob = displayToIsoDob(dob);
      const r2 = await api("/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate: isoDob || "", phone: newPhone || "" }),
      });
      ok = ok && r2.ok;

      const prefPayload = {
        certificate: certificate || "",
        favorite_subject: favoriteSubject || "",
        daily_hours: dailyHours || "",
      };
      const r3 = await api("/user/profile/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefPayload),
      });
      ok = ok && r3.ok;

      if (ok) {
        setSuccess("Changes saved successfully!");
        setEditMode(false);
        // Update initial refs to reflect the latest saved state
        initialUsernameRef.current = newUsername;
        initialPhoneRef.current = newPhone;
        initialDobRef.current = dob || "";
        initialCertificateRef.current = certificate || "";
        initialFavoriteSubjectRef.current = favoriteSubject || "";
        initialDailyHoursRef.current = dailyHours || "";
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
  const avatarSrc = avatarUrl || DEFAULT_AVATAR_URL;

  return (
    <DashboardShell studentName={headerName}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-slate-400">
            Manage your personal information used across Edufy services.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 shadow-lg shadow-black/30">
          <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-neutral-700 bg-neutral-900">
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={loading || saving || avatarUploading}
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-100">{headerName}</div>
                <div className="text-xs text-slate-400 break-all">{email}</div>
                <div className="text-xs text-slate-500">Learning to achieve excellence</div>
                <button
                  type="button"
                  onClick={handleAvatarButtonClick}
                  disabled={loading || saving || avatarUploading}
                  className="mt-2 inline-flex items-center rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-neutral-900 disabled:opacity-60"
                >
                  {avatarUploading ? "Uploading..." : "Change avatar"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-1 md:flex md:flex-row">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Username
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-white focus:ring-2 focus:ring-white/40"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading || saving || !editMode}
              />
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Phone number (optional)
              </label>
              <input
                type="tel"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-white focus:ring-2 focus:ring-white/40"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading || saving || !editMode}
              />
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Date of birth (optional)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-white focus:ring-2 focus:ring-white/40"
                value={dob}
                onChange={(e) => setDob(formatDobInput(e.target.value))}
                disabled={loading || saving || !editMode}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 md:flex-row">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                What certificate do you
                <br />
                have?
              </label>
              <select
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-white focus:ring-2 focus:ring-white/40"
                value={certificate}
                onChange={(e) => setCertificate(e.target.value)}
                disabled={loading || saving || !editMode}
              >
                <option value="">Choose</option>
                <option value="none">No certificate</option>
                <optgroup label="IELTS">
                  <option value="9.0">9.0</option>
                  <option value="8.5">8.5</option>
                  <option value="8.0">8.0</option>
                  <option value="7.5">7.5</option>
                  <option value="7.0">7.0</option>
                  <option value="6.5">6.5</option>
                  <option value="6.0">6.0</option>
                  <option value="5.5">5.5</option>
                  <option value="5.0">5.0</option>
                  <option value="4.5">4.5</option>
                  <option value="4.0">4.0</option>
                </optgroup>
                <optgroup label="TOEFL iBT">
                  <option value="118-120">118-120</option>
                  <option value="110-117">110-117</option>
                  <option value="95-109">95-109</option>
                  <option value="72-94">72-94</option>
                  <option value="42-71">42-71</option>
                  <option value="<41">&lt;41</option>
                </optgroup>
                <optgroup label="SAT">
                  <option value="1550-1600">1550-1600</option>
                  <option value="1450-1540">1450-1540</option>
                  <option value="1300-1440">1300-1440</option>
                  <option value="1100-1290">1100-1290</option>
                  <option value="<1000">&lt;1000</option>
                </optgroup>
                <optgroup label="AP">
                  <option value="5">5</option>
                  <option value="4">4</option>
                  <option value="3">3</option>
                  <option value="2">2</option>
                  <option value="1">1</option>
                </optgroup>
                <optgroup label="ACT">
                  <option value="34-36">34-36</option>
                  <option value="30-33">30-33</option>
                  <option value="25-29">25-29</option>
                  <option value="20-24">20-24</option>
                  <option value="<20">&lt;20</option>
                </optgroup>
              </select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Which subject are you
                <br />
                interested in?
              </label>
              <select
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-white focus:ring-2 focus:ring-white/40"
                value={favoriteSubject}
                onChange={(e) => setFavoriteSubject(e.target.value)}
                disabled={loading || saving || !editMode}
              >
                <option value="">Choose</option>
                <optgroup label="STEM (Science, Technology, Engineering, Mathematics)">
                  <option value="Mathematics">Mathematics</option>
                  <option value="Statistics">Statistics</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Robotics">Robotics</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Environmental Science">Environmental Science</option>
                  <option value="Astronomy">Astronomy</option>
                  <option value="Geology">Geology</option>
                  <option value="Material Science">Material Science</option>
                  <option value="Biotechnology">Biotechnology</option>
                  <option value="Genetics">Genetics</option>
                  <option value="Nanotechnology">Nanotechnology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Game Development">Game Development</option>
                </optgroup>
                <optgroup label="Economics and Business">
                  <option value="Economics">Economics</option>
                  <option value="Finance">Finance</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Business Management">Business Management</option>
                  <option value="Entrepreneurship">Entrepreneurship</option>
                  <option value="Marketing">Marketing</option>
                  <option value="International Business">International Business</option>
                  <option value="Supply Chain Management">Supply Chain Management</option>
                  <option value="Project Management">Project Management</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Business Analytics">Business Analytics</option>
                </optgroup>
                <optgroup label="Social Sciences">
                  <option value="Psychology">Psychology</option>
                  <option value="Sociology">Sociology</option>
                  <option value="Anthropology">Anthropology</option>
                  <option value="Political Science">Political Science</option>
                  <option value="International Relations">International Relations</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                  <option value="Linguistics">Linguistics</option>
                  <option value="Law">Law</option>
                  <option value="Education">Education</option>
                  <option value="Ethics">Ethics</option>
                  <option value="Philosophy">Philosophy</option>
                  <option value="Criminology">Criminology</option>
                  <option value="Public Policy">Public Policy</option>
                  <option value="Communication Studies">Communication Studies</option>
                </optgroup>
                <optgroup label="Humanities">
                  <option value="English Language">English Language</option>
                  <option value="Literature">Literature</option>
                  <option value="Creative Writing">Creative Writing</option>
                  <option value="Journalism">Journalism</option>
                  <option value="Media Studies">Media Studies</option>
                  <option value="Religious Studies">Religious Studies</option>
                  <option value="Cultural Studies">Cultural Studies</option>
                  <option value="Comparative Literature">Comparative Literature</option>
                  <option value="Classics">Classics</option>
                  <option value="Archaeology">Archaeology</option>
                  <option value="Gender Studies">Gender Studies</option>
                  <option value="Language Studies">Language Studies</option>
                </optgroup>
                <optgroup label="Arts and Creative Disciplines">
                  <option value="Design">Design</option>
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Industrial Design">Industrial Design</option>
                  <option value="Interior Design">Interior Design</option>
                  <option value="Fashion Design">Fashion Design</option>
                  <option value="Visual Arts">Visual Arts</option>
                  <option value="Painting">Painting</option>
                  <option value="Sculpture">Sculpture</option>
                  <option value="Photography">Photography</option>
                  <option value="Music">Music</option>
                  <option value="Music Theory">Music Theory</option>
                  <option value="Performing Arts">Performing Arts</option>
                  <option value="Theatre">Theatre</option>
                  <option value="Film Studies">Film Studies</option>
                  <option value="Dance">Dance</option>
                  <option value="Digital Arts">Digital Arts</option>
                  <option value="Animation">Animation</option>
                  <option value="Game Design">Game Design</option>
                  <option value="Creative Media">Creative Media</option>
                  <option value="Multimedia Arts">Multimedia Arts</option>
                </optgroup>
              </select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                How many hours do you
                <br />
                spend for a study per day?
              </label>
              <select
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-white focus:ring-2 focus:ring-white/40"
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value)}
                disabled={loading || saving || !editMode}
              >
                <option value="">Choose</option>
                <option value="0-1">0-1</option>
                <option value="2-3">2-3</option>
                <option value="4-5">4-5</option>
                <option value="6-7">6-7</option>
                <option value="8-9">8-9</option>
                <option value="10+">10+</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={handleStartEdit}
                disabled={loading || saving}
                className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-neutral-900 disabled:opacity-60"
              >
                Edit
              </button>
              <div className="space-y-1 text-xs">
                {loading && <p className="text-slate-400">Loading profile...</p>}
                {error && <p className="text-red-400">{error}</p>}
                {success && <p className="text-emerald-400">{success}</p>}
              </div>
            </div>
            {editMode && (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || saving}
                className="inline-flex items-center justify-center rounded-lg border border-cyan-500 bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
