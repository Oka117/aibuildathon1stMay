"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  hint: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    hint: "Dashboard",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    href: "/timetable",
    label: "Calendar",
    hint: "Weekly timetable",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    href: "/tasks",
    label: "Tasks",
    hint: "Today / scheduled",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/planner",
    label: "Planner",
    hint: "Smart weekly plan",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6h16M4 12h10M4 18h7" />
      </svg>
    ),
  },
  {
    href: "/focus",
    label: "Focus",
    hint: "Pomodoro timer",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export function SfShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full bg-[var(--color-sf-bg)]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[80px] shrink-0 flex-col border-r border-slate-200 bg-white md:flex lg:w-[240px]">
        <div className="flex items-center gap-2 px-4 pt-6 pb-6 lg:px-6">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-base font-bold text-white shadow-sm">
            S
          </div>
          <div className="hidden text-[20px] font-bold tracking-tight lg:block">
            <span className="text-slate-900">Study</span>
            <span className="text-[var(--color-sf-primary)]">Flow</span>
          </div>
        </div>

        <nav className="flex-1 px-2 lg:px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.label}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:px-4 ${
                      active
                        ? "bg-indigo-50 text-[var(--color-sf-primary)]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="hidden flex-col leading-tight lg:flex">
                      <span>{item.label}</span>
                      <span
                        className={`text-[10px] font-normal ${active ? "text-indigo-400" : "text-slate-400"}`}
                      >
                        {item.hint}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-4 text-white shadow-sm lg:block">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-80">
              Tip
            </p>
            <p className="mt-1 text-sm leading-snug">
              Plan your week tonight — Sunday-you will thank you.
            </p>
          </div>
        </nav>

        <div className="border-t border-slate-100 px-3 py-4 lg:px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-sm font-semibold text-white">
              A
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-semibold text-slate-900">
                Alex Chen
              </p>
              <p className="truncate text-[11px] text-slate-500">
                ANU · CECS
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile-only logo */}
            <div className="text-lg font-bold tracking-tight md:hidden">
              <span className="text-slate-900">Study</span>
              <span className="text-[var(--color-sf-primary)]">Flow</span>
            </div>
            <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200 md:flex md:w-[420px]">
              <svg
                className="h-4 w-4 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                placeholder="Search tasks, lectures, deadlines…"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <span className="hidden rounded border border-slate-200 px-1.5 text-[10px] font-medium text-slate-400 md:inline">
                ⌘K
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              aria-label="Notifications"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--color-sf-danger)]" />
            </button>
            <button className="hidden rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 md:inline-flex">
              + Quick add
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-sm font-semibold text-white md:hidden">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 md:px-8 md:py-8 md:pb-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        {/* Mobile bottom nav (visible only when sidebar is hidden) */}
        <nav className="fixed right-0 bottom-0 left-0 z-20 border-t border-slate-200 bg-white/95 px-2 pt-2 pb-3 backdrop-blur md:hidden">
          <ul className="flex items-center justify-between">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition ${
                      active
                        ? "text-[var(--color-sf-primary)]"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
