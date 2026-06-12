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
    <div className="relative flex min-h-screen bg-black text-white">
      <MeshBackground variant="marketing" />
      <div className="marketing-noise" aria-hidden />
      <div className="marketing-grid-overlay" aria-hidden />

      <div className="relative hidden w-1/2 flex-col justify-between border-r border-white/10 bg-gradient-to-br from-violet-950/80 via-black to-cyan-950/40 p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold">
            W
          </div>
          <span className="font-display text-xl font-bold">WriteGuard AI</span>
        </Link>
        <div>
          <h1 className="font-display mb-4 text-4xl font-bold leading-tight">
            Think big.<br />
            <span className="gradient-text">We handle the details.</span>
          </h1>
          <p className="max-w-md text-white/55">
            Grammar, tone, humanizer, SOP generator, plagiarism detection, and 30+ AI writing tools — all in one workspace.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/50">
            {[
              "Free grammar & spell checking",
              "AI humanizer & detector",
              "SOP & report generator",
              "Team workspaces on Business",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/30">© {new Date().getFullYear()} WriteGuard AI</p>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold">
            W
          </div>
          <span className="font-display font-bold">WriteGuard AI</span>
        </Link>
        {title && (
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-bold">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-white/50">{subtitle}</p>}
          </div>
        )}
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
