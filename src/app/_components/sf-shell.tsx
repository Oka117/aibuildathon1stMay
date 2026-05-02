"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "~/trpc/react";

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

type GlobalSearchHit =
  | {
      kind: "task";
      id: string;
      title: string;
      subtitle: string;
      href: string;
    }
  | {
      kind: "page";
      id: string;
      title: string;
      subtitle: string;
      href: string;
    };

const STATIC_PAGE_HITS: GlobalSearchHit[] = [
  {
    kind: "page",
    id: "page-home",
    title: "Home",
    subtitle: "Dashboard · today's schedule",
    href: "/",
  },
  {
    kind: "page",
    id: "page-timetable",
    title: "Timetable",
    subtitle: "Weekly calendar · lectures",
    href: "/timetable",
  },
  {
    kind: "page",
    id: "page-tasks",
    title: "Tasks",
    subtitle: "All tasks · pending / in progress / done",
    href: "/tasks",
  },
  {
    kind: "page",
    id: "page-planner",
    title: "Planner",
    subtitle: "AI plan generator · suggestions",
    href: "/planner",
  },
  {
    kind: "page",
    id: "page-focus",
    title: "Focus",
    subtitle: "Pomodoro timer · deep work",
    href: "/focus",
  },
];

export function SfShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Global search state — drives the header search input + results dropdown.
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Close the search dropdown when clicking outside the search box.
  useEffect(() => {
    if (!searchOpen) return;
    function onPointer(e: MouseEvent) {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [searchOpen]);

  // Browser-notification state. We mirror Notification.permission so the bell
  // icon shows whether notifications are granted, denied, or still pending.
  const [notifPermission, setNotifPermission] = useState<
    "granted" | "denied" | "default" | "unsupported"
  >("default");

  // Read current permission once on mount (Notification is window-only).
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifPermission("unsupported");
      return;
    }
    setNotifPermission(
      window.Notification.permission as "granted" | "denied" | "default",
    );
  }, []);

  // Pull active (non-done) cards once so the bell can preview a count of
  // upcoming items. Uses the same query as every other surface.
  const cardsQuery = api.card.list.useQuery();
  const cards = cardsQuery.data ?? [];
  const upcomingCount = cards.filter((c) => c.state !== "done").length;

  // Compute matching tasks + pages for the global search box.
  const searchResults = useMemo<GlobalSearchHit[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const taskHits: GlobalSearchHit[] = cards
      .filter((c) => {
        const hay = `${c.name} ${c.description ?? ""} ${c.tag ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 6)
      .map((c) => ({
        kind: "task" as const,
        id: c.id,
        title: c.name,
        subtitle:
          (c.tag ? `${c.tag} · ` : "") +
          (c.state === "done"
            ? "Completed"
            : c.state === "in_progress"
              ? "In progress"
              : "Pending"),
        href: "/tasks",
      }));
    const pageHits = STATIC_PAGE_HITS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q),
    );
    return [...taskHits, ...pageHits];
  }, [cards, searchQuery]);

  function handleSearchSelect(hit: GlobalSearchHit) {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(hit.href);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSearchSelect(searchResults[0]!);
    } else if (searchQuery.trim()) {
      // Fall through: send the user to /tasks with no match.
      setSearchOpen(false);
      router.push("/tasks");
    }
  }

  async function handleNotificationsClick() {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    // Already granted: show a sample notification summarizing upcoming work.
    if (window.Notification.permission === "granted") {
      const body =
        upcomingCount === 0
          ? "All caught up — nothing pending."
          : `You have ${upcomingCount} active task${upcomingCount === 1 ? "" : "s"}.`;
      new window.Notification("StudyFlow", {
        body,
        icon: "/favicon.ico",
      });
      return;
    }
    if (window.Notification.permission === "denied") {
      alert(
        "Notifications are blocked. Enable them in your browser site settings to receive reminders.",
      );
      return;
    }
    // Otherwise: ask for permission.
    const result = await window.Notification.requestPermission();
    setNotifPermission(result as "granted" | "denied" | "default");
    if (result === "granted") {
      new window.Notification("StudyFlow notifications enabled", {
        body: "We'll remind you about upcoming tasks here.",
        icon: "/favicon.ico",
      });
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar — frosted glass over the global sky gradient */}
      <aside className="sticky top-0 hidden h-screen w-[80px] shrink-0 flex-col border-r border-white/40 bg-white/55 backdrop-blur-xl md:flex lg:w-[240px]">
        <div className="flex items-center gap-2 px-4 pt-6 pb-6 lg:px-6">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-600 text-base font-bold text-white shadow-sm">
            S
          </div>
          <div className="hidden text-[20px] font-bold tracking-tight lg:block">
            <span className="text-slate-900">Study</span>
            <span className="text-sky-600">Flow</span>
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
                        ? "bg-white/80 text-sky-700 shadow-sm"
                        : "text-slate-700 hover:bg-white/60 hover:text-slate-900"
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="hidden flex-col leading-tight lg:flex">
                      <span>{item.label}</span>
                      <span
                        className={`text-[10px] font-normal ${active ? "text-sky-500" : "text-slate-500"}`}
                      >
                        {item.hint}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 hidden rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 p-4 text-white shadow-md lg:block">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-85">
              Tip
            </p>
            <p className="mt-1 text-sm leading-snug">
              Plan your week tonight — Sunday-you will thank you.
            </p>
          </div>
        </nav>

        <div className="border-t border-white/40 px-3 py-4 lg:px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-sm font-semibold text-white">
              A
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-semibold text-slate-900">
                Alex Chen
              </p>
              <p className="truncate text-[11px] text-slate-600">
                ANU · CECS
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/40 bg-white/55 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile-only logo */}
            <div className="text-lg font-bold tracking-tight md:hidden">
              <span className="text-slate-900">Study</span>
              <span className="text-sky-600">Flow</span>
            </div>
            <div
              ref={searchRef}
              className="relative hidden md:block md:w-[420px]"
            >
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-white/60"
              >
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
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search tasks, lectures, deadlines…"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchOpen(false);
                    }}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </form>
              {searchOpen && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-80 overflow-auto rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200">
                  {searchResults.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-slate-500">
                      No matches for &ldquo;{searchQuery}&rdquo;.
                    </p>
                  ) : (
                    <ul className="text-sm">
                      {searchResults.map((hit) => (
                        <li key={`${hit.kind}-${hit.id}`}>
                          <button
                            type="button"
                            onClick={() => handleSearchSelect(hit)}
                            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <span
                              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                hit.kind === "task"
                                  ? "bg-sky-50 text-sky-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {hit.kind === "task" ? "Task" : "Page"}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold text-slate-900">
                                {hit.title}
                              </span>
                              <span className="block truncate text-xs text-slate-500">
                                {hit.subtitle}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNotificationsClick}
              className="relative grid h-9 w-9 place-items-center rounded-full bg-white/70 text-slate-600 ring-1 ring-white/60 transition hover:bg-white"
              aria-label="Notifications"
              title={
                notifPermission === "granted"
                  ? `Notifications on — ${upcomingCount} active task${upcomingCount === 1 ? "" : "s"}`
                  : notifPermission === "denied"
                    ? "Notifications blocked — enable in browser settings"
                    : notifPermission === "unsupported"
                      ? "Notifications not supported in this browser"
                      : "Click to enable browser notifications"
              }
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
              {notifPermission === "granted" && upcomingCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500" />
              )}
              {notifPermission === "default" && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-400" />
              )}
              {notifPermission === "denied" && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-slate-400" />
              )}
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-sm font-semibold text-white md:hidden">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 md:px-8 md:py-8 md:pb-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        {/* Mobile bottom nav (visible only when sidebar is hidden) */}
        <nav className="fixed right-0 bottom-0 left-0 z-20 border-t border-white/40 bg-white/80 px-2 pt-2 pb-3 backdrop-blur-xl md:hidden">
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
                      active ? "text-sky-700" : "text-slate-600 hover:text-slate-900"
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
