'use client';

import { useAdminAuth } from '../useAdminAuth';

export default function AdminMonitoringPage() {
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
        <h1 className="text-2xl font-semibold tracking-[0.2em] uppercase">Monitoring</h1>
        <p className="mt-2 text-sm text-gray-400">
          Quick view of backend services health and admin tooling links.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-1">Services</p>
          <p className="text-sm text-gray-300">
            This section can show health checks for gateway_service, auth_service, user_service, and
            file_service once health endpoints are wired.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-1">Dashboards</p>
          <p className="text-sm text-gray-300">
            Links to Docker UI, Grafana, or other monitoring tools can be added here for quick
            access.
          </p>
        </div>
      </div>
    </div>
  );
}
