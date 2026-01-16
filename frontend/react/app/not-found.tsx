import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#050509] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6">
        <div className="text-xs uppercase tracking-[0.18em] text-gray-400">404</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-gray-400">
          The page you are looking for doesn&apos;t exist or was moved.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-gray-900 hover:bg-white/90 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-white/5 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
