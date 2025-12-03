'use client';

import { useAdminAuth } from '../useAdminAuth';

export default function AdminUsersPage() {
  const { loading, error } = useAdminAuth();

  if (loading) {
    return <p className="text-sm text-gray-300">Loading admin data...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[0.2em] uppercase">Users</h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage Edufy users: search, inspect profiles, and control access.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="text-sm text-gray-300">
          A table with users, filters by plan and subscription status, and actions like block or
          unblock will be added here in the next steps.
        </p>
      </div>
    </div>
  );
}
