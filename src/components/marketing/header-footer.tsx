"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_GROUPS } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 items-center justify-center">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 opacity-50 blur-md transition-opacity group-hover:opacity-90" />
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white">
          W
        </div>
      </div>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        WriteGuard AI
      </span>
    </Link>
  );
}

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <header className="marketing-dark-header sticky top-0 z-50">
      <div className="marketing-container flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_GROUPS.map((group) =>
            group.columns ? (
              <div
                key={group.label}
                className="relative"
                onMouseEnter={() => setOpenMenu(group.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                >
                  {group.label}
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
                {openMenu === group.label && (
                  <div className="marketing-nav-dropdown marketing-nav-dropdown-dark absolute left-0 top-full mt-1 min-w-[640px] rounded-2xl p-6">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      {group.columns.map((col) => (
                        <div key={col.title}>
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-violet-400">
                            {col.title}
                          </p>
                          <ul className="space-y-2">
                            {col.links.map((link) => (
                              <li key={link.href + link.label}>
                                <Link
                                  href={link.href}
                                  className="block rounded-lg px-2 py-1.5 hover:bg-white/5"
                                >
                                  <span className="text-sm font-medium text-white">
                                    {link.label}
                                  </span>
                                  {link.description && (
                                    <span className="mt-0.5 block text-xs text-white/45">
                                      {link.description}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={group.label}
                href={group.href ?? "/"}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
              >
                {group.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" className="text-white/70 hover:bg-white/5 hover:text-white" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="btn-glow border-0 text-white">
            <Link href="/signup">Get WriteGuard — It&apos;s free</Link>
          </Button>
        </div>

        <button
          type="button"
          className="marketing-mobile-menu-btn rounded-lg p-2 text-white/70 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-black/95 px-6 py-4 lg:hidden">
          <div className="space-y-1">
            {[
              ["/features", "Features"],
              ["/tools", "Tools"],
              ["/solutions", "Solutions"],
              ["/pricing", "Pricing"],
              ["/about", "About"],
              ["/login", "Log in"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Button asChild className="mt-2 w-full btn-glow border-0 text-white">
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                Get started free
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black">
      <div className="marketing-container py-16">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white">
              W
            </div>
            <span className="font-display text-lg font-bold text-white">WriteGuard AI</span>
          </div>
          <p className="max-w-md text-sm text-white/45">
            The AI writing workspace for teams who care about voice, clarity, and trust.
            30+ tools. One jet-black dashboard.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Product",
              links: [
                { label: "Features", href: "/features" },
                { label: "Solutions", href: "/solutions" },
                { label: "All tools", href: "/tools" },
                { label: "Pricing", href: "/pricing" },
              ],
            },
            {
              title: "Tools",
              links: [
                { label: "Writing Studio", href: "/features#intelligence" },
                { label: "AI Humanizer", href: "/tools#ai-humanizer" },
                { label: "SOP & Reports", href: "/tools#sop-reports" },
                { label: "Plagiarism", href: "/tools#plagiarism-checker" },
              ],
            },
            {
              title: "Resources",
              links: [
                { label: "About", href: "/about" },
                { label: "Resume Builder", href: "/tools#resume-builder" },
                { label: "Brand Images", href: "/tools#brand-images" },
                { label: "Smart Rewrite", href: "/tools#smart-rewrite" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "Sign up", href: "/signup" },
                { label: "Log in", href: "/login" },
                { label: "Contact sales", href: "mailto:sales@writeguard.ai" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-violet-400">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/35">
            © {new Date().getFullYear()} WriteGuard AI. All rights reserved.
          </p>
          <p className="text-sm text-white/35">Crafted for writers who refuse to blend in.</p>
        </div>
      </div>
    </footer>
  );
}

export function MarketingCta({
  title = "Great writing gets work done",
  description = "Work smarter with WriteGuard AI — grammar, rewrites, humanizer, SOP generator, and 30+ tools in one workspace.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={cn("marketing-section marketing-cta-dark", className)}>
      <div className="marketing-container text-center">
        <h2 className="font-display mb-4 text-3xl font-bold text-white md:text-4xl">{title}</h2>
        <p className="mx-auto mb-8 max-w-xl text-white/55">{description}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="btn-glow h-12 border-0 px-8 text-white" asChild>
            <Link href="/signup">Sign up — It&apos;s free</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-white/20 bg-transparent px-8 text-white hover:bg-white/10"
            asChild
          >
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
