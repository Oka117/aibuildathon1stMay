"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SfShell } from "~/app/_components/sf-shell";
import { api } from "~/trpc/react";

type CardLike = {
  id: string;
  name: string;
  description: string;
  datetime?: string | null;
  priority?: "high" | "medium" | "low" | null;
  state: "pending" | "in_progress" | "done";
  done: boolean;
  tag?: string | null;
};

type Level = "High" | "Medium" | "Low";

const levelStyles: Record<Level, string> = {
  High: "bg-red-50 text-red-600 ring-red-100",
  Medium: "bg-amber-50 text-amber-700 ring-amber-100",
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

/** Map a card's priority into the deadline-list "level" tag. */
function priorityToLevel(p?: string | null): Level {
  if (p === "high") return "High";
  if (p === "low") return "Low";
  return "Medium";
}

/** Format an ISO-ish "YYYY-MM-DD HH:MM" string for the schedule list. */
function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  const m = /(\d{1,2}):(\d{2})/.exec(iso);
  return m ? `${m[1]!.padStart(2, "0")}:${m[2]}` : "—";
}

function formatDateLabel(iso?: string | null): string {
  if (!iso) return "Anytime";
  return iso.slice(0, 10);
}

/**
 * Convert a YYYY-MM-DD string into a Date set to local midnight.
 * Falls back to today if parsing fails.
 */
function parseDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return new Date();
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Build a 7-day strip starting Monday of the week containing `anchor`.
 * Marks the day matching `selected` as active.
 */
function buildWeekStrip(anchor: Date) {
  // JS Sunday=0, Monday=1; treat Monday as the first column.
  const dow = anchor.getDay();
  const offsetToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + offsetToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SCHEDULE_COLORS = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-violet-500",
];

export default function Home() {
  const cardsQuery = api.card.list.useQuery();
  const cards = useMemo<CardLike[]>(
    () => (cardsQuery.data ?? []) as CardLike[],
    [cardsQuery.data],
  );

  // Selected day for the "Today's Schedule" panel. Starts at the actual today.
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());

  const weekDays = useMemo(() => buildWeekStrip(selectedDay), [selectedDay]);
  const todayKey = ymd(new Date());
  const selectedKey = ymd(selectedDay);

  // Cards scheduled on the selected day, sorted by start time.
  const scheduleForDay = useMemo(() => {
    return cards
      .filter((c) => (c.datetime ?? "").slice(0, 10) === selectedKey)
      .sort((a, b) =>
        (a.datetime ?? "").localeCompare(b.datetime ?? ""),
      );
  }, [cards, selectedKey]);

  // Days that have at least one scheduled card — used for the dot under the day.
  const daysWithItems = useMemo(() => {
    const set = new Set<string>();
    for (const c of cards) {
      const k = (c.datetime ?? "").slice(0, 10);
      if (k) set.add(k);
    }
    return set;
  }, [cards]);

  // Upcoming deadlines: pending or in-progress cards with a future datetime.
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    return cards
      .filter((c) => c.state !== "done")
      .filter((c) => {
        if (!c.datetime) return false;
        return parseDate(c.datetime) >= todayMidnight;
      })
      .sort((a, b) =>
        (a.datetime ?? "").localeCompare(b.datetime ?? ""),
      )
      .slice(0, 4);
  }, [cards]);

  // "Recommended Now" — top-priority active (non-done) card.
  const recommended = useMemo(() => {
    return [...cards]
      .filter((c) => c.state !== "done")
      .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))[0];
  }, [cards]);

  const todaysCount = scheduleForDay.length;
  const totalMinutes = scheduleForDay.length * 60; // rough heuristic
  const deepWorkHours = (
    cards.filter((c) => c.state === "done").length * 0.75
  ).toFixed(1);
  const weekDeadlines = upcomingDeadlines.length;
  const highCount = upcomingDeadlines.filter((d) => d.priority === "high").length;
  const doneCount = cards.filter((c) => c.state === "done").length;
  const totalCount = cards.length;
  const progressPct =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const monthLabel = `${weekDays[0]!.toLocaleString("en-US", {
    month: "short",
  })} ${weekDays[0]!.getDate()} – ${weekDays[6]!.getDate()}`;

  return (
    <SfShell>
      <section className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl leading-tight font-bold text-slate-900 md:text-3xl">
            Good morning, Alex <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Plan well, focus more, stress less. Here&apos;s what today looks
            like.
          </p>
        </div>
        <Link
          href="/focus"
          className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Start Focus Session
        </Link>
      </section>

      {/* Stat strip */}
      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Tasks today"
          value={String(todaysCount)}
          hint={
            todaysCount === 0
              ? "Calendar clear"
              : `~${Math.round(totalMinutes / 60)}h scheduled`
          }
          accent="emerald"
          icon={
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 12 2 2 4-4" />
              <rect x="3" y="4" width="18" height="16" rx="3" />
            </svg>
          }
        />
        <Stat
          label="Deep-work hours"
          value={deepWorkHours}
          hint={`${doneCount} task${doneCount === 1 ? "" : "s"} completed`}
          accent="sky"
          icon={
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />
        <Stat
          label="Deadlines this week"
          value={String(weekDeadlines)}
          hint={
            highCount > 0
              ? `${highCount} high priority`
              : "No critical items"
          }
          accent="amber"
          icon={
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <path d="M14 3v6h6" />
            </svg>
          }
        />
        <Stat
          label="Stress level"
          value={progressPct >= 60 ? "Manageable" : "Pushing"}
          hint={`${progressPct}% of plan done`}
          accent="green"
          icon={<span className="text-base">😊</span>}
        />
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-8">
          {/* Recommended Now → links to /focus */}
          <Link
            href="/focus"
            className="block rounded-2xl bg-gradient-to-br from-sky-100/95 via-white/95 to-white/95 p-5 shadow-sm ring-1 ring-white/60 backdrop-blur transition hover:shadow-md"
          >
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-sky-600 uppercase">
                  Recommended Now
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {recommended?.name ?? "All caught up — take a breather."}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  {recommended ? (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                        {recommended.tag ?? "Task"}
                      </span>
                      <span>· Open Focus to start a session.</span>
                    </>
                  ) : (
                    <span>
                      No active tasks. Add one on the Tasks page or generate a
                      plan.
                    </span>
                  )}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm">
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Open Focus
                </div>
              </div>
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-sky-100/70 text-sky-600">
                <svg
                  className="h-12 w-12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Week strip — clickable, drives the schedule below */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                This week
              </h3>
              <span className="text-xs text-slate-500">{monthLabel}</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((d, i) => {
                const key = ymd(d);
                const active = key === selectedKey;
                const isToday = key === todayKey;
                const hasItems = daysWithItems.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(d)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 transition ${
                      active
                        ? "bg-sky-600 text-white shadow-sm"
                        : "bg-white/70 text-slate-700 ring-1 ring-white/60 hover:bg-white"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold tracking-wider uppercase ${
                        active ? "text-sky-100" : "text-slate-500"
                      }`}
                    >
                      {DAY_LABELS[i]}
                    </span>
                    <span className="text-base font-semibold">
                      {d.getDate()}
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        hasItems
                          ? active
                            ? "bg-white"
                            : "bg-sky-500"
                          : "bg-transparent"
                      }`}
                    />
                    {isToday && !active && (
                      <span className="text-[9px] font-semibold tracking-wide text-sky-600 uppercase">
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Schedule for selected day */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {selectedKey === todayKey
                    ? "Today's Schedule"
                    : `Schedule for ${selectedKey}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {scheduleForDay.length === 0
                    ? "Nothing scheduled."
                    : `${scheduleForDay.length} item${scheduleForDay.length === 1 ? "" : "s"} planned`}
                </p>
              </div>
              <Link
                href="/timetable"
                className="text-xs font-medium text-sky-700 hover:underline"
              >
                View full timetable →
              </Link>
            </div>
            {scheduleForDay.length === 0 ? (
              <p className="rounded-xl bg-white/60 px-3 py-6 text-center text-xs text-slate-500">
                No tasks scheduled for {formatDateLabel(selectedKey)}. Pick a
                different day above or add a task.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {scheduleForDay.map((s, i) => {
                  const dot =
                    SCHEDULE_COLORS[i % SCHEDULE_COLORS.length] ?? "bg-sky-500";
                  return (
                    <li
                      key={s.id}
                      className="flex items-start gap-3 rounded-xl bg-white/70 p-3 ring-1 ring-white/60"
                    >
                      <div className="w-12 shrink-0 text-xs font-semibold text-slate-500">
                        {formatTime(s.datetime)}
                      </div>
                      <div
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-semibold ${
                            s.state === "done"
                              ? "text-slate-400 line-through"
                              : "text-slate-900"
                          }`}
                        >
                          {s.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {(s.tag ?? "Task") +
                            (s.state === "in_progress"
                              ? " · in progress"
                              : "")}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:col-span-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Upcoming Deadlines
              </h3>
              <Link
                href="/tasks"
                className="text-xs font-medium text-sky-700 hover:underline"
              >
                All →
              </Link>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="rounded-xl bg-white/60 px-3 py-4 text-center text-xs text-slate-500">
                No upcoming deadlines. Nice!
              </p>
            ) : (
              <ul className="space-y-2.5">
                {upcomingDeadlines.map((d) => {
                  const level = priorityToLevel(d.priority);
                  return (
                    <li
                      key={d.id}
                      className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5 ring-1 ring-white/60"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <path d="M14 3v6h6M9 13h6M9 17h4" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {d.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {(d.tag ?? "Task") + " · " + (d.datetime ?? "")}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${levelStyles[level]}`}
                      >
                        {level}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <h4 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Weekly Progress
            </h4>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {progressPct}%
              </span>
              <span className="text-xs text-slate-500">
                {doneCount} / {totalCount} tasks
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {progressPct >= 50
                ? "On track — keep going."
                : "Pick one task and start now."}
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-white/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <h4 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Stress Level
              </h4>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Manageable
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span aria-hidden className="text-2xl">
                😊
              </span>
              <p className="text-xs text-slate-600">
                You&apos;re in a good spot today. Keep balancing study and
                breaks.
              </p>
            </div>
            <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-400">
              <div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow ring-1 ring-slate-200"
                style={{ left: `${Math.max(10, 100 - progressPct)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>Calm</span>
              <span>Balanced</span>
              <span>Overwhelmed</span>
            </div>
          </Card>
        </div>
      </section>
    </SfShell>
  );
}

function priorityRank(p?: string | null): number {
  if (p === "high") return 3;
  if (p === "medium") return 2;
  if (p === "low") return 1;
  return 0;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl bg-white/85 p-5 shadow-sm ring-1 ring-white/60 backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}

const accentMap: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
};

function Stat({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  accent: keyof typeof accentMap;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-white/60 backdrop-blur">
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${accentMap[accent] ?? accentMap.sky}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium tracking-wider text-slate-500 uppercase">
          {label}
        </p>
        <p className="truncate text-lg font-bold text-slate-900">{value}</p>
        <p className="truncate text-[11px] text-slate-500">{hint}</p>
      </div>
    </div>
  );
}
