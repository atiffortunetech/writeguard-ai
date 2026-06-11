import Link from "next/link";
import { MeshBackground } from "@/components/ui/mesh-background";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="marketing-page relative flex min-h-screen">
      <MeshBackground variant="light" />

      {/* Left brand panel — Grammarly-style split auth */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-violet-700 via-violet-600 to-cyan-600 p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-sm font-bold backdrop-blur">
            W
          </div>
          <span className="font-display text-xl font-bold">WriteGuard AI</span>
        </Link>
        <div>
          <h1 className="font-display mb-4 text-4xl font-bold leading-tight">
            Think big.<br />We handle the details.
          </h1>
          <p className="max-w-md text-violet-100">
            Grammar, tone, humanizer, plagiarism detection, and 30+ AI writing tools — all in one workspace.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-violet-100">
            {["Free grammar & spell checking", "AI humanizer & detector", "Team workspaces on Business"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-violet-200/80">© {new Date().getFullYear()} WriteGuard AI</p>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white">
            W
          </div>
          <span className="font-display font-bold text-slate-900">WriteGuard AI</span>
        </Link>
        {(title || subtitle) && (
          <div className="mb-6 max-w-md text-center lg:hidden">
            {title && <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
