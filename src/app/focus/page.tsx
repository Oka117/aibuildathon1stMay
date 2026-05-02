"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SfShell } from "~/app/_components/sf-shell";
import { api } from "~/trpc/react";

const PRESETS = [25, 45, 60];

type CardLike = {
  id: string;
  name: string;
  description: string;
  datetime?: string | null;
  tag?: string | null;
  state: "pending" | "in_progress" | "done";
  priority?: "high" | "medium" | "low" | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  const m = /(\d{1,2}):(\d{2})/.exec(iso);
  return m ? `${m[1]!.padStart(2, "0")}:${m[2]}` : "—";
}

function priorityRank(p?: string | null): number {
  if (p === "high") return 3;
  if (p === "medium") return 2;
  if (p === "low") return 1;
  return 0;
}

export default function FocusPage() {
  const utils = api.useUtils();

  // Timer state
  const [target, setTarget] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

  // Real card data — drives the focus log + the "now focusing on" pill.
  const cardsQuery = api.card.list.useQuery();
  const cards = useMemo<CardLike[]>(
    () => (cardsQuery.data ?? []) as CardLike[],
    [cardsQuery.data],
  );

  const setStateMut = api.card.setState.useMutation({
    onSuccess: () => utils.card.list.invalidate(),
  });

  // The card currently in focus = first in_progress card (if any),
  // else the highest-priority pending one.
  const focusCard = useMemo(() => {
    const active = cards.find((c) => c.state === "in_progress");
    if (active) return active;
    return [...cards]
      .filter((c) => c.state === "pending")
      .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))[0];
  }, [cards]);

  // Cards that contributed to today's focus log: in_progress (still active)
  // and done. We also keep stable order (in-progress first).
  const todayPlan = useMemo(() => {
    return [...cards]
      .filter((c) => c.state === "in_progress" || c.state === "done")
      .sort((a, b) => {
        if (a.state !== b.state) return a.state === "in_progress" ? -1 : 1;
        // Within same state, earlier scheduled time first.
        return (a.datetime ?? "").localeCompare(b.datetime ?? "");
      });
  }, [cards]);

  // Tick the timer.
  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [running]);

  function setMinutes(min: number) {
    setRunning(false);
    setTarget(min * 60);
    setRemaining(min * 60);
  }

  function startSession() {
    // If there's a focus candidate that hasn't started yet, mark it in_progress
    // when the user hits Start. This wires the timer into the task lifecycle.
    if (focusCard && focusCard.state === "pending") {
      setStateMut.mutate({ id: focusCard.id, state: "in_progress" });
    }
    setRunning(true);
  }

  function completeFocus() {
    if (focusCard && focusCard.state === "in_progress") {
      setStateMut.mutate({ id: focusCard.id, state: "done" });
    }
    setRunning(false);
    setRemaining(target);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = target === 0 ? 0 : 1 - remaining / target;

  // Rough total deep-work minutes — count completed cards × 45 min as a stub.
  const totalDeepMinutes = todayPlan.filter((c) => c.state === "done").length * 45;
  const totalDeepLabel =
    totalDeepMinutes >= 60
      ? `${Math.floor(totalDeepMinutes / 60)}h ${totalDeepMinutes % 60}m`
      : `${totalDeepMinutes}m`;

  return (
    <SfShell>
      <section className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Focus</h1>
        <p className="text-sm text-slate-600">
          One block at a time. No multitasking.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-white/85 p-8 shadow-sm ring-1 ring-white/60 backdrop-blur">
            {/* Now-focusing pill */}
            {focusCard ? (
              <div className="mb-5 flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 ring-1 ring-sky-100">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-sky-600 uppercase">
                    {focusCard.state === "in_progress"
                      ? "Now focusing on"
                      : "Up next"}
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {focusCard.name}
                  </p>
                </div>
                <span className="ml-3 shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-100">
                  {focusCard.tag ?? "Task"}
                </span>
              </div>
            ) : (
              <p className="mb-5 rounded-xl bg-white/70 px-3 py-2 text-center text-xs text-slate-500 ring-1 ring-white/60">
                No active task. Add one on the Tasks page.
              </p>
            )}

            <div className="relative mx-auto h-72 w-72">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e0f2fe"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                  style={{ transition: "stroke-dashoffset 0.3s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-slate-900 tabular-nums">
                  {mm}:{ss}
                </span>
                <span className="mt-2 text-[11px] tracking-[0.18em] text-slate-500 uppercase">
                  {running ? "Focus session" : "Ready"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setMinutes(p)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    target === p * 60
                      ? "bg-sky-600 text-white"
                      : "bg-white/70 text-slate-700 ring-1 ring-white/60 hover:bg-white"
                  }`}
                >
                  {p} min
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => (running ? setRunning(false) : startSession())}
                className="rounded-full bg-sky-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                {running ? "Pause" : "Start"}
              </button>
              <button
                onClick={completeFocus}
                disabled={!focusCard || focusCard.state !== "in_progress"}
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                Complete task
              </button>
              <button
                onClick={() => {
                  setRunning(false);
                  setRemaining(target);
                }}
                className="rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-white/60 transition hover:bg-white"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-2xl bg-white/85 p-5 shadow-sm ring-1 ring-white/60 backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Today&apos;s focus log
              </h3>
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                Real plan
              </span>
            </div>

            {cardsQuery.isLoading ? (
              <ul className="mt-3 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={i}
                    className="h-10 animate-pulse rounded-xl bg-white/70"
                  />
                ))}
              </ul>
            ) : todayPlan.length === 0 ? (
              <p className="mt-3 rounded-xl bg-white/60 px-3 py-6 text-center text-xs text-slate-500">
                No active or completed tasks yet. Hit{" "}
                <span className="font-semibold text-sky-700">Start</span> on a
                task in the Tasks page to begin a focus session.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {todayPlan.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 ring-1 ring-white/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        {formatTime(c.datetime)}
                      </span>
                      <span
                        className={`truncate text-sm ${
                          c.state === "done"
                            ? "text-slate-500 line-through"
                            : "text-slate-900"
                        }`}
                      >
                        {c.name}
                      </span>
                    </div>
                    <span
                      className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        c.state === "done"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          : "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
                      }`}
                    >
                      {c.state === "done" ? "Done" : "In progress"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-xs text-slate-600">
              Total deep work today:{" "}
              <span className="font-semibold">{totalDeepLabel}</span>
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 p-5 text-white shadow-sm">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-85">
              Tip
            </p>
            <p className="mt-1 text-sm leading-snug">
              Silence notifications and put your phone face-down. Tell yourself
              you only have to start — momentum will do the rest.
            </p>
          </div>
        </div>
      </section>
    </SfShell>
  );
}
