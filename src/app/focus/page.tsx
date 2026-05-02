"use client";

import { useEffect, useRef, useState } from "react";
import { SfShell } from "~/app/_components/sf-shell";

const PRESETS = [25, 45, 60];

export default function FocusPage() {
  const [target, setTarget] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

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

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = target === 0 ? 0 : 1 - remaining / target;

  return (
    <SfShell>
      <section className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Focus</h1>
        <p className="text-sm text-slate-500">
          One block at a time. No multitasking.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
            <div className="relative mx-auto h-72 w-72">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#eef2ff"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#4f46e5"
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
                <span className="mt-2 text-[11px] tracking-[0.18em] text-slate-400 uppercase">
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
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p} min
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setRunning((r) => !r)}
                className="rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                {running ? "Pause" : "Start"}
              </button>
              <button
                onClick={() => {
                  setRunning(false);
                  setRemaining(target);
                }}
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Today&apos;s focus log
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <LogRow time="09:00" label="Calculus problem set" min={45} />
              <LogRow time="11:30" label="Lecture notes review" min={25} />
              <LogRow time="14:00" label="Group project research" min={60} />
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Total deep work today: <span className="font-semibold">2h 10m</span>
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 text-white shadow-sm">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-80">
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

function LogRow({
  time,
  label,
  min,
}: {
  time: string;
  label: string;
  min: number;
}) {
  return (
    <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500">{time}</span>
        <span className="text-sm text-slate-800">{label}</span>
      </div>
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        {min}m
      </span>
    </li>
  );
}
