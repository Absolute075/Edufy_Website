'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../useAdminAuth';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { loading, error } = useAdminAuth();

  useEffect(() => {
    router.replace('/admin/subscriptions');
  }, [router]);

  if (loading) {
    return <p className="text-sm text-gray-300">Loading admin data...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return <p className="text-sm text-gray-300">Redirecting...</p>;
}
