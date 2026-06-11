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
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 opacity-40 blur-md transition-opacity group-hover:opacity-70" />
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white">
          W
        </div>
      </div>
      <span className="font-display text-lg font-bold tracking-tight text-slate-900">
        WriteGuard AI
      </span>
    </Link>
  );
}

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 border-b border-violet-100/80 bg-white/95 backdrop-blur-md">
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
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                >
                  {group.label}
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
                {openMenu === group.label && (
                  <div className="marketing-nav-dropdown">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      {group.columns.map((col) => (
                        <div key={col.title}>
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-violet-500">
                            {col.title}
                          </p>
                          <ul className="space-y-2">
                            {col.links.map((link) => (
                              <li key={link.href + link.label}>
                                <Link
                                  href={link.href}
                                  className="block rounded-lg px-2 py-1.5 hover:bg-violet-50"
                                >
                                  <span className="text-sm font-medium text-slate-900">
                                    {link.label}
                                  </span>
                                  {link.description && (
                                    <span className="mt-0.5 block text-xs text-slate-500">
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
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700"
              >
                {group.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="btn-glow border-0 text-white">
            <Link href="/signup">Get WriteGuard — It&apos;s free</Link>
          </Button>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-violet-100 bg-white px-6 py-4 lg:hidden">
          <div className="space-y-1">
            <Link href="/features" className="block rounded-lg px-3 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Features</Link>
            <Link href="/tools" className="block rounded-lg px-3 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Tools</Link>
            <Link href="/pricing" className="block rounded-lg px-3 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Pricing</Link>
            <Link href="/login" className="block rounded-lg px-3 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Button asChild className="mt-2 w-full">
              <Link href="/signup" onClick={() => setMobileOpen(false)}>Get started free</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-container py-16">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white">
              W
            </div>
            <span className="font-display text-lg font-bold text-white">WriteGuard AI</span>
          </div>
          <p className="max-w-md text-sm text-slate-400">
            Great writing gets work done. The AI writing workspace for teams who care about voice, clarity, and trust.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Product", links: [{ label: "Features", href: "/features" }, { label: "All tools", href: "/tools" }, { label: "Pricing", href: "/pricing" }, { label: "Sign up", href: "/signup" }] },
            { title: "Tools", links: [{ label: "Grammar Checker", href: "/tools#grammar-checker" }, { label: "AI Humanizer", href: "/tools#ai-humanizer" }, { label: "Plagiarism", href: "/tools#plagiarism-checker" }, { label: "Word Counter", href: "/tools#word-counter" }] },
            { title: "Agents", links: [{ label: "Resume Builder", href: "/tools#resume-builder" }, { label: "AI Grader", href: "/tools#ai-grader" }, { label: "Citation Finder", href: "/tools#citation-finder" }, { label: "Reader Reactions", href: "/tools#reader-reactions" }] },
            { title: "Company", links: [{ label: "Log in", href: "/login" }, { label: "Contact sales", href: "mailto:sales@writeguard.ai" }, { label: "Privacy", href: "/features#security" }] },
          ].map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-violet-400">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} WriteGuard AI. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">Crafted for writers who refuse to blend in.</p>
        </div>
      </div>
    </footer>
  );
}

export function MarketingCta({
  title = "Great writing gets work done",
  description = "Work smarter with WriteGuard AI — grammar, rewrites, humanizer, and 30+ tools in one workspace.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={cn("marketing-section bg-gradient-to-br from-violet-600 to-violet-800 text-white", className)}>
      <div className="marketing-container text-center">
        <h2 className="font-display mb-4 text-3xl font-bold md:text-4xl">{title}</h2>
        <p className="mx-auto mb-8 max-w-xl text-violet-100">{description}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="secondary" className="h-12 bg-white px-8 text-violet-700 hover:bg-violet-50" asChild>
            <Link href="/signup">Sign up — It&apos;s free</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 border-white/30 bg-transparent px-8 text-white hover:bg-white/10" asChild>
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
