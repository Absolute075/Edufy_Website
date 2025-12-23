"use client";

import { useEffect, useState, useRef, ChangeEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { usePageTitle } from "../lib/usePageTitle";
import { useUserProfile } from "../UserProfileProvider";

const DEFAULT_AVATAR_URL =
  "https://resources.edufyuzbekistan.com/storage/images/stockuser.jpg";

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
  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
    patch,
    refresh,
  } = useUserProfile();

  const [username, setUsername] = useState(() => profileData?.username ?? "");
  const [email, setEmail] = useState(() => profileData?.email ?? "");
  const [phone, setPhone] = useState(() => profileData?.phone ?? "");
  const [dob, setDob] = useState(() => profileData?.dobDisplay ?? "");
  const [avatarUrl, setAvatarUrl] = useState(() => profileData?.avatarUrl ?? "");
  const [certificates, setCertificates] = useState<string[]>(() => profileData?.certificates ?? []);
  const [selectedCertificate, setSelectedCertificate] = useState("");
  const [favoriteSubject, setFavoriteSubject] = useState(() => profileData?.favoriteSubject ?? "");
  const [dailyHours, setDailyHours] = useState(() => profileData?.dailyHours ?? "");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const initialUsernameRef = useRef<string>("");
  const initialPhoneRef = useRef<string>("");
  const initialDobRef = useRef<string>("");
  const initialCertificatesRef = useRef<string>("");
  const initialFavoriteSubjectRef = useRef<string>("");
  const initialDailyHoursRef = useRef<string>("");

  // Stale-while-revalidate: на монтировании профиля запрашиваем актуальные данные в фоне
  useEffect(() => {
    // не ждём промис, просто триггерим фоновый refetch
    refresh().catch(() => {
      // ошибки уже обрабатываются внутри провайдера / глобально
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!profileData) return;
    if (editMode) return;

    const phoneVal = profileData.phone || "";
    const dobVal = profileData.dobDisplay || "";
    const certList = profileData.certificates || [];
    const favSubjVal = profileData.favoriteSubject || "";
    const hoursVal = profileData.dailyHours || "";

    setUsername(profileData.username || "");
    setEmail(profileData.email || "");
    setPhone(phoneVal);
    setDob(dobVal);
    setAvatarUrl(profileData.avatarUrl || "");
    setCertificates(certList);
    setFavoriteSubject(favSubjVal);
    setDailyHours(hoursVal);

    initialUsernameRef.current = profileData.username || "";
    initialPhoneRef.current = phoneVal;
    initialDobRef.current = dobVal;
    initialCertificatesRef.current = certList.join(", ");
    initialFavoriteSubjectRef.current = favSubjVal;
    initialDailyHoursRef.current = hoursVal;
  }, [profileData, editMode]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (!success) return;
    const id = window.setTimeout(() => {
      setSuccess(null);
    }, 3000);
    return () => window.clearTimeout(id);
  }, [success]);

  function handleAvatarButtonClick() {
    if (avatarUploading || profileLoading || saving || !editMode) return;
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  }

  function handleCertificateSelectChange(e: ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (!val) return;

    setError(null);
    setSuccess(null);

    if (val === "No certificate") {
      setCertificates(["No certificate"]);
    } else {
      setCertificates((prev) => {
        const withoutNone = prev.filter((c) => c !== "No certificate");
        if (withoutNone.includes(val)) return withoutNone;
        return [...withoutNone, val];
      });
    }

    setSelectedCertificate("");
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
        patch({ avatarUrl: body.avatarUrl });
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
    if (profileLoading || saving) return;
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
        certificates.join(", ") !== (initialCertificatesRef.current || "") ||
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
        certificates,
        certificate: certificates.join(", "),
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
        initialCertificatesRef.current = certificates.join(", ");
        initialFavoriteSubjectRef.current = favoriteSubject || "";
        initialDailyHoursRef.current = dailyHours || "";
        patch({
          username: newUsername || "",
          email,
          phone: newPhone || "",
          dobDisplay: dob || "",
          avatarUrl,
          certificates: [...certificates],
          favoriteSubject: favoriteSubject || "",
          dailyHours: dailyHours || "",
        });
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
                  disabled={profileLoading || saving || avatarUploading}
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-100">{headerName}</div>
                <div className="text-xs text-slate-400 break-all">{email}</div>
                <div className="text-xs text-slate-500">Learning to achieve excellence</div>
                <button
                  type="button"
                  onClick={handleAvatarButtonClick}
                  disabled={profileLoading || saving || avatarUploading}
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
                disabled={profileLoading || saving || !editMode}
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
                disabled={profileLoading || saving || !editMode}
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
                disabled={profileLoading || saving || !editMode}
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
                value={selectedCertificate}
                onChange={handleCertificateSelectChange}
                disabled={profileLoading || saving || !editMode}
              >
                <option value="">Choose</option>
                <option value="No certificate">No certificate</option>
                <optgroup label="IELTS">
                  <option value="IELTS: 9.0">9.0</option>
                  <option value="IELTS: 8.5">8.5</option>
                  <option value="IELTS: 8.0">8.0</option>
                  <option value="IELTS: 7.5">7.5</option>
                  <option value="IELTS: 7.0">7.0</option>
                  <option value="IELTS: 6.5">6.5</option>
                  <option value="IELTS: 6.0">6.0</option>
                  <option value="IELTS: 5.5">5.5</option>
                  <option value="IELTS: 5.0">5.0</option>
                  <option value="IELTS: 4.5">4.5</option>
                  <option value="IELTS: 4.0">4.0</option>
                </optgroup>
                <optgroup label="TOEFL iBT">
                  <option value="TOEFL iBT: 118-120">118-120</option>
                  <option value="TOEFL iBT: 110-117">110-117</option>
                  <option value="TOEFL iBT: 95-109">95-109</option>
                  <option value="TOEFL iBT: 72-94">72-94</option>
                  <option value="TOEFL iBT: 42-71">42-71</option>
                  <option value="TOEFL iBT: <41">&lt;41</option>
                </optgroup>
                <optgroup label="SAT">
                  <option value="SAT: 1550-1600">1550-1600</option>
                  <option value="SAT: 1450-1540">1450-1540</option>
                  <option value="SAT: 1300-1440">1300-1440</option>
                  <option value="SAT: 1100-1290">1100-1290</option>
                  <option value="SAT: <1000">&lt;1000</option>
                </optgroup>
                <optgroup label="AP">
                  <option value="AP: 5">5</option>
                  <option value="AP: 4">4</option>
                  <option value="AP: 3">3</option>
                  <option value="AP: 2">2</option>
                  <option value="AP: 1">1</option>
                </optgroup>
                <optgroup label="ACT">
                  <option value="ACT: 34-36">34-36</option>
                  <option value="ACT: 30-33">30-33</option>
                  <option value="ACT: 25-29">25-29</option>
                  <option value="ACT: 20-24">20-24</option>
                  <option value="ACT: <20">&lt;20</option>
                </optgroup>
              </select>
              {certificates.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {certificates.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-slate-200"
                    >
                      <span>{c}</span>
                      {editMode && (
                        <button
                          type="button"
                          onClick={() =>
                            setCertificates((prev) => prev.filter((x) => x !== c))
                          }
                          className="text-slate-500 hover:text-slate-200"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
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
                disabled={profileLoading || saving || !editMode}
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
                disabled={profileLoading || saving || !editMode}
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
                disabled={profileLoading || saving}
                className="boton-elegante"
              >
                Edit
              </button>
              <div className="space-y-1 text-xs">
                {profileLoading && <p className="text-slate-400">Loading profile...</p>}
                {(error || profileError) && (
                  <p className="text-red-400">{error || profileError}</p>
                )}
                {success && <p className="text-emerald-400">{success}</p>}
              </div>
            </div>
            {editMode && (
              <button
                type="button"
                onClick={handleSave}
                disabled={profileLoading || saving}
                className="profile-save-btn"
              >
                <div className="svg-wrapper-1">
                  <div className="svg-wrapper">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      className="icon"
                    >
                      <path d="M22,15.04C22,17.23 20.24,19 18.07,19H5.93C3.76,19 2,17.23 2,15.04C2,13.07 3.43,11.44 5.31,11.14C5.28,11 5.27,10.86 5.27,10.71C5.27,9.33 6.38,8.2 7.76,8.2C8.37,8.2 8.94,8.43 9.37,8.8C10.14,7.05 11.13,5.44 13.91,5.44C17.28,5.44 18.87,8.06 18.87,10.83C18.87,10.94 18.87,11.06 18.86,11.17C20.65,11.54 22,13.13 22,15.04Z" />
                    </svg>
                  </div>
                </div>
                <span>{saving ? "Saving..." : "Save"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-save-btn {
          font-family: inherit;
          font-size: 16px;
          background: #212121;
          color: white;
          fill: rgb(155, 153, 153);
          padding: 0.45em 0.75em;
          padding-left: 0.7em;
          display: flex;
          align-items: center;
          cursor: pointer;
          border: none;
          border-radius: 11px;
          font-weight: 1000;
        }

        .profile-save-btn span {
          display: block;
          margin-left: 0.2em;
          transition: all 0.3s ease-in-out;
        }

        .profile-save-btn svg {
          display: block;
          transform-origin: center center;
          transition: transform 0.3s ease-in-out;
        }

        .profile-save-btn:hover {
          background: #000;
        }

        .profile-save-btn:hover .svg-wrapper {
          transform: scale(1.25);
          transition: 0.5s linear;
        }

        .profile-save-btn:hover svg {
          transform: translateX(1.2em) scale(1.1);
          fill: #fff;
        }

        .profile-save-btn:hover span {
          opacity: 0;
          transition: 0.5s linear;
        }

        .profile-save-btn:active {
          transform: scale(0.95);
        }

        .profile-save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .profile-save-btn:disabled:hover {
          background: #212121;
        }

        .profile-save-btn:disabled:hover .svg-wrapper {
          transform: none;
          transition: none;
        }

        .profile-save-btn:disabled:hover svg {
          transform: none;
          fill: rgb(155, 153, 153);
        }

        .profile-save-btn:disabled:hover span {
          opacity: 1;
          transition: none;
        }

        .boton-elegante {
          padding: 0.45em 0.9em;
          border: 1px solid #2c2c2c;
          background-color: #1a1a1a;
          color: #ffffff;
          font-size: 16px;
          cursor: pointer;
          border-radius: 999px;
          transition: all 0.4s ease;
          outline: none;
          position: relative;
          overflow: hidden;
          font-weight: bold;
        }

        .boton-elegante::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0) 70%
          );
          transform: scale(0);
          transition: transform 0.5s ease;
        }

        .boton-elegante:hover::after {
          transform: scale(4);
        }

        .boton-elegante:hover {
          border-color: #666666;
          background: #292929;
        }
      `}</style>
    </DashboardShell>
  );
}
