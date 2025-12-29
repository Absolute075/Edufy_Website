'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/subscriptions');
  }, [router]);

  return <p className="text-sm text-gray-300">Redirecting...</p>;
}
