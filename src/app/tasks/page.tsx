"use client";

import { useMemo, useState } from "react";
import { SfShell } from "~/app/_components/sf-shell";

type Priority = "high" | "medium" | "low";

type Task = {
  id: string;
  title: string;
  list: string;
  due: "today" | "upcoming" | "all";
  flagged: boolean;
  done: boolean;
  priority: Priority;
  time?: string;
};

const seed: Task[] = [
  {
    id: "t1",
    title: "Finish Calculus problem set",
    list: "Goals",
    due: "today",
    flagged: true,
    done: false,
    priority: "high",
    time: "Morning",
  },
  {
    id: "t2",
    title: "Review Biology lecture notes",
    list: "Goals",
    due: "today",
    flagged: false,
    done: false,
    priority: "medium",
    time: "Afternoon",
  },
  {
    id: "t3",
    title: "Reply to study-group message",
    list: "Daily",
    due: "today",
    flagged: false,
    done: true,
    priority: "low",
    time: "Tonight",
  },
  {
    id: "t4",
    title: "Read Chapter 4 — Hist 200",
    list: "Goals",
    due: "today",
    flagged: false,
    done: false,
    priority: "medium",
    time: "Tonight",
  },
  {
    id: "t5",
    title: "Draft Lab Report intro",
    list: "Goals",
    due: "upcoming",
    flagged: true,
    done: false,
    priority: "high",
  },
  {
    id: "t6",
    title: "Book gym slot",
    list: "Fitness",
    due: "upcoming",
    flagged: false,
    done: false,
    priority: "low",
  },
  {
    id: "t7",
    title: "Practice guitar 20 min",
    list: "Guitar",
    due: "all",
    flagged: false,
    done: false,
    priority: "low",
  },
  {
    id: "t8",
    title: "Plan weekend revision",
    list: "26S1",
    due: "upcoming",
    flagged: false,
    done: false,
    priority: "medium",
  },
];

type FilterId = "today" | "upcoming" | "all" | "flagged" | "done";

const filters: {
  id: FilterId;
  label: string;
  zh: string;
  color: string;
}[] = [
  { id: "today", label: "Today", zh: "今天", color: "bg-indigo-500" },
  { id: "upcoming", label: "Scheduled", zh: "计划", color: "bg-rose-500" },
  { id: "all", label: "All", zh: "全部", color: "bg-slate-500" },
  { id: "flagged", label: "Flagged", zh: "旗标", color: "bg-amber-500" },
  { id: "done", label: "Completed", zh: "完成", color: "bg-emerald-500" },
];

const myLists = [
  { name: "Love", count: 1, color: "bg-rose-500" },
  { name: "Goals", count: 4, color: "bg-violet-500" },
  { name: "Become a Fluent Speaker", count: 1, color: "bg-amber-500" },
  { name: "Guitar", count: 9, color: "bg-emerald-500" },
  { name: "Fitness", count: 41, color: "bg-cyan-500" },
  { name: "26S1", count: 1, color: "bg-indigo-500" },
  { name: "Daily", count: 1, color: "bg-rose-400" },
];

const priorityColors: Record<Priority, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

export default function TasksPage() {
  const [filter, setFilter] = useState<FilterId>("today");
  const [tasks, setTasks] = useState<Task[]>(seed);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  const counts = useMemo(() => {
    return {
      today: tasks.filter((t) => t.due === "today" && !t.done).length,
      upcoming: tasks.filter((t) => t.due === "upcoming" && !t.done).length,
      all: tasks.filter((t) => !t.done).length,
      flagged: tasks.filter((t) => t.flagged && !t.done).length,
      done: tasks.filter((t) => t.done).length,
    } satisfies Record<FilterId, number>;
  }, [tasks]);

  const visible = useMemo(() => {
    return tasks
      .filter((t) => {
        if (filter === "today") return t.due === "today" && !t.done;
        if (filter === "upcoming") return t.due === "upcoming" && !t.done;
        if (filter === "flagged") return t.flagged && !t.done;
        if (filter === "done") return t.done;
        return !t.done;
      })
      .filter((t) =>
        query.trim()
          ? t.title.toLowerCase().includes(query.trim().toLowerCase())
          : true,
      );
  }, [tasks, filter, query]);

  const groupedByTime = useMemo(() => {
    const groups: Record<string, Task[]> = {
      Morning: [],
      Afternoon: [],
      Tonight: [],
      Anytime: [],
    };
    for (const t of visible) {
      const key = t.time ?? "Anytime";
      const arr = groups[key];
      if (arr) arr.push(t);
      else groups[key] = [t];
    }
    return groups;
  }, [visible]);

  function toggleDone(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  function toggleFlag(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, flagged: !t.flagged } : t)),
    );
  }

  function addTask() {
    const title = draft.trim();
    if (!title) return;
    setTasks((prev) => [
      ...prev,
      {
        id: `t${prev.length + 1}-${Date.now()}`,
        title,
        list: "Goals",
        due: filter === "upcoming" ? "upcoming" : "today",
        flagged: false,
        done: false,
        priority: "medium",
        time: "Anytime",
      },
    ]);
    setDraft("");
  }

  const activeFilter = filters.find((f) => f.id === filter)!;

  return (
    <SfShell>
      <section className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Tasks
          </h1>
          <p className="text-sm text-slate-500">
            任务列表 · plan today, win the week
          </p>
        </div>
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200 sm:w-80">
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks 搜索"
            className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left filter & lists rail */}
        <aside className="space-y-5 lg:col-span-4 xl:col-span-3">
          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <p className="px-1 pt-1 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Smart filters
            </p>
            <ul className="space-y-1">
              {filters.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => setFilter(f.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                      filter === f.id
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-lg text-white ${f.color}`}
                      >
                        <span className="text-[10px] font-bold">•</span>
                      </span>
                      <span className="leading-tight">
                        <span className="block text-sm font-semibold">
                          {f.label}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {f.zh}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`text-sm font-semibold ${filter === f.id ? "text-indigo-700" : "text-slate-400"}`}
                    >
                      {counts[f.id]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <p className="px-1 pt-1 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              My Lists · 我的列表
            </p>
            <ul className="space-y-0.5">
              {myLists.map((l) => (
                <li
                  key={l.name}
                  className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-md text-white ${l.color}`}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 6h16M4 12h16M4 18h10" />
                      </svg>
                    </span>
                    <span className="text-sm text-slate-700">{l.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{l.count}</span>
                </li>
              ))}
            </ul>
            <button className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-50">
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              添加列表 · Add List
            </button>
          </div>
        </aside>

        {/* Right task area */}
        <div className="lg:col-span-8 xl:col-span-9">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h2 className="text-3xl font-bold text-indigo-600">
                  {activeFilter.label}
                </h2>
                <p className="text-xs text-slate-400">{activeFilter.zh}</p>
              </div>
              <span className="text-xs text-slate-400">
                {visible.length} item{visible.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <button
                onClick={addTask}
                className="grid h-5 w-5 place-items-center rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-indigo-600"
                aria-label="Add"
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Add a task… press Enter"
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button
                onClick={addTask}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Add
              </button>
            </div>

            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <svg
                  className="h-12 w-12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <p className="mt-2 text-sm">已完成所有提醒事项</p>
                <p className="text-[11px]">All caught up — nice work.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(groupedByTime).map(([label, items]) =>
                  items.length === 0 ? null : (
                    <div key={label}>
                      <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                        {label}
                      </p>
                      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl ring-1 ring-slate-100">
                        {items.map((t) => (
                          <li
                            key={t.id}
                            className="group flex items-center gap-3 bg-white px-3 py-2.5 transition hover:bg-slate-50"
                          >
                            <button
                              onClick={() => toggleDone(t.id)}
                              aria-label="toggle done"
                              className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                                t.done
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "border-slate-300 text-transparent hover:border-indigo-500"
                              }`}
                            >
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m5 12 5 5L20 7" />
                              </svg>
                            </button>
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${priorityColors[t.priority]}`}
                              title={`${t.priority} priority`}
                            />
                            <span
                              className={`flex-1 truncate text-sm ${
                                t.done
                                  ? "text-slate-400 line-through"
                                  : "text-slate-800"
                              }`}
                            >
                              {t.title}
                            </span>
                            <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 sm:inline">
                              {t.list}
                            </span>
                            <button
                              onClick={() => toggleFlag(t.id)}
                              className={
                                t.flagged
                                  ? "text-amber-500"
                                  : "text-slate-300 hover:text-amber-500"
                              }
                              aria-label="flag"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill={t.flagged ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M4 21V4h13l-2 5 2 5H4" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </SfShell>
  );
}
