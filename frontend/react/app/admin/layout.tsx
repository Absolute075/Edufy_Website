import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-black/80 backdrop-blur-sm">
        <div className="flex items-baseline gap-2">
          <span className="font-ptserif tracking-[0.35em] text-sm text-white/80">EDUFY</span>
          <span className="text-xs uppercase tracking-[0.25em] text-gray-400">Admin Panel</span>
        </div>
      </header>
      <main className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto">{children}</main>
    </div>
  );
}
