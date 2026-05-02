"use client";

import { useMemo, useState } from "react";
import { SfShell } from "~/app/_components/sf-shell";
import { api } from "~/trpc/react";

type Priority = "high" | "medium" | "low";
type CardType = "todo" | "event";

const priorityChip: Record<Priority, string> = {
  high: "bg-red-50 text-red-600 ring-red-100",
  medium: "bg-amber-50 text-amber-700 ring-amber-100",
  low: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

const typeChip: Record<CardType, string> = {
  todo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  event: "bg-rose-50 text-rose-600 ring-rose-100",
};

type SuggestionTask = {
  name: string;
  description: string;
  datetime: string;
  recommendReason: string;
  priority: Priority;
};

/**
 * Escape a single field for CSV per RFC 4180:
 *   - wrap in double quotes if it contains comma, quote, CR or LF
 *   - double up any existing quotes
 */
function csvField(value: string): string {
  const needsQuote = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

function tasksToCsv(tasks: SuggestionTask[]): string {
  const header = ["Name", "Description", "Datetime", "Recommend Reason", "Priority"];
  const rows = tasks.map((t) => [
    t.name,
    t.description,
    t.datetime,
    t.recommendReason,
    t.priority,
  ]);
  const lines = [header, ...rows].map((r) => r.map(csvField).join(","));
  // Prefix BOM so Excel opens UTF-8 cleanly.
  return "﻿" + lines.join("\r\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function PlannerPage() {
  const utils = api.useUtils();

  // ── AI side state ──────────────────────────────────────────────────────────
  const [context, setContext] = useState(
    "I have a Chemistry lab report due Friday and a Calculus problem set Monday. " +
      "I'm feeling a bit overwhelmed and didn't sleep well last night.",
  );
  const [count, setCount] = useState(5);
  const generate = api.planner.generate.useMutation();

  // ── Manual create form state ───────────────────────────────────────────────
  const [type, setType] = useState<CardType>("todo");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // ── Server data ────────────────────────────────────────────────────────────
  const cardsQuery = api.card.list.useQuery();
  const create = api.card.create.useMutation({
    onSuccess: () => utils.card.list.invalidate(),
  });
  const toggleDone = api.card.toggleDone.useMutation({
    onSuccess: () => utils.card.list.invalidate(),
  });
  const remove = api.card.remove.useMutation({
    onSuccess: () => utils.card.list.invalidate(),
  });

  const cards = useMemo(
    () => cardsQuery.data ?? [],
    [cardsQuery.data],
  );
  const undone = useMemo(() => cards.filter((c) => !c.done).length, [cards]);

  const suggestions: SuggestionTask[] = useMemo(
    () => (generate.data?.tasks ?? []) as SuggestionTask[],
    [generate.data],
  );

  function submitManualCard(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      {
        type,
        name: name.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
        },
      },
    );
  }

  function handleExportCsv() {
    if (suggestions.length === 0) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    downloadCsv(`studyflow-plan-${stamp}.csv`, tasksToCsv(suggestions));
  }

  return (
    <SfShell>
      <section className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            AI Planner
          </h1>
          <p className="text-sm text-slate-500">
            Tell StudyFlow what&apos;s on your mind — get a plan, save the bits
            you like.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
            {undone} active card{undone === 1 ? "" : "s"}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
            {cards.length} total
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left — AI conversation + suggestions */}
        <div className="space-y-5 lg:col-span-7">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-indigo-500 uppercase">
              Talk to your planner
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              What does the next week look like?
            </h2>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              placeholder="e.g. I have a lab report due Friday, feeling tired, want to start the week strong…"
              className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                Suggestions:
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  {[3, 5, 7, 10].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setContext(
                      "Lab report due Friday, problem set Monday, feeling overwhelmed.",
                    )
                  }
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Reset prompt
                </button>
                <button
                  type="button"
                  disabled={generate.isPending || !context.trim()}
                  onClick={() =>
                    generate.mutate({ context: context.trim(), count })
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {generate.isPending ? (
                    <Spinner />
                  ) : (
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
                    </svg>
                  )}
                  {generate.isPending ? "Thinking…" : "Generate plan"}
                </button>
              </div>
            </div>
            {generate.error && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 ring-1 ring-rose-100">
                {generate.error.message}
              </p>
            )}
            {generate.data?.note && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-100">
                {generate.data.note}
              </p>
            )}
            {generate.data && (
              <p className="mt-2 text-[11px] text-slate-400">
                Source:{" "}
                <span className="font-semibold">
                  {generate.data.source === "deepseek"
                    ? "DeepSeek API"
                    : "Sample data fallback"}
                </span>
              </p>
            )}
          </div>

          {/* Suggestions table */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Suggestions
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={suggestions.length === 0}
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  title="Export plan as CSV"
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                  </svg>
                  Export CSV
                </button>
                {suggestions.length > 0 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-indigo-600 hover:underline"
                    onClick={() => {
                      for (const t of suggestions) {
                        create.mutate({
                          type: "todo",
                          name: t.name,
                          description: t.description,
                          datetime: t.datetime,
                          priority: t.priority,
                          recommendReason: t.recommendReason,
                        });
                      }
                    }}
                  >
                    + Add all to my cards
                  </button>
                )}
              </div>
            </div>

            {!generate.data && !generate.isPending && <EmptyHint />}

            {generate.isPending && (
              <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
                <div className="space-y-2 p-3">
                  {Array.from({ length: count }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded-lg bg-slate-100"
                    />
                  ))}
                </div>
              </div>
            )}

            {generate.data && suggestions.length > 0 && (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Name</th>
                        <th className="px-3 py-2.5">Description</th>
                        <th className="px-3 py-2.5 whitespace-nowrap">
                          Datetime
                        </th>
                        <th className="px-3 py-2.5">Recommend Reason</th>
                        <th className="px-3 py-2.5">Priority</th>
                        <th className="px-3 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {suggestions.map((t, i) => (
                        <tr
                          key={`${t.name}-${i}`}
                          className="align-top hover:bg-slate-50/60"
                        >
                          <td className="px-3 py-2.5 font-semibold text-slate-900">
                            {t.name}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">
                            {t.description}
                          </td>
                          <td className="px-3 py-2.5 text-xs whitespace-nowrap text-slate-500">
                            {t.datetime}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-indigo-700">
                            {t.recommendReason}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${priorityChip[t.priority]}`}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              onClick={() =>
                                create.mutate({
                                  type: "todo",
                                  name: t.name,
                                  description: t.description,
                                  datetime: t.datetime,
                                  priority: t.priority,
                                  recommendReason: t.recommendReason,
                                })
                              }
                              className="rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                            >
                              + Add
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {generate.data && suggestions.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-xs text-slate-400">
                No suggestions returned. Try rephrasing your context.
              </p>
            )}
          </div>
        </div>

        {/* Right — manual create + my cards */}
        <div className="space-y-5 lg:col-span-5">
          <form
            onSubmit={submitManualCard}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              New card
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Build a todo or event manually.
            </p>

            <div className="mt-3 inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              {(["todo", "event"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    type === t
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {t === "todo" ? "Todo" : "Event"}
                </button>
              ))}
            </div>

            <label className="mt-3 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={
                type === "todo" ? "Draft Lab Report intro" : "Study group at library"
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <label className="mt-3 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a short description (optional)…"
              className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setName("");
                  setDescription("");
                }}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={create.isPending || !name.trim()}
                className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {create.isPending ? "Saving…" : "Add card"}
              </button>
            </div>
          </form>

          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between px-2 pt-1 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">My cards</h3>
              {cards.length > 0 && (
                <span className="text-xs text-slate-400">
                  {undone} / {cards.length} active
                </span>
              )}
            </div>

            {cardsQuery.isLoading ? (
              <ul className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={i}
                    className="h-16 animate-pulse rounded-xl bg-slate-50"
                  />
                ))}
              </ul>
            ) : cards.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-slate-400">
                No cards yet. Generate a plan or add one manually.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {cards.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-3 px-2 py-2.5"
                  >
                    <button
                      onClick={() => toggleDone.mutate({ id: c.id })}
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
                        c.done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 text-transparent hover:border-indigo-500"
                      }`}
                      aria-label="toggle done"
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
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${typeChip[c.type]}`}
                        >
                          {c.type}
                        </span>
                        <p
                          className={`truncate text-sm font-semibold ${
                            c.done
                              ? "text-slate-400 line-through"
                              : "text-slate-900"
                          }`}
                        >
                          {c.name}
                        </p>
                        {c.priority && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${priorityChip[c.priority]}`}
                          >
                            {c.priority}
                          </span>
                        )}
                      </div>
                      {c.description && (
                        <p className="mt-0.5 text-xs text-slate-600">
                          {c.description}
                        </p>
                      )}
                      {(c.datetime ?? c.recommendReason) && (
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          {c.datetime && (
                            <span className="inline-flex items-center gap-1">
                              <CalIcon /> {c.datetime}
                            </span>
                          )}
                          {c.recommendReason && (
                            <span className="truncate text-indigo-600">
                              · {c.recommendReason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => remove.mutate({ id: c.id })}
                      className="shrink-0 rounded-md p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                      aria-label="remove"
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
                        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </SfShell>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center">
      <p className="text-sm font-semibold text-slate-700">
        Describe your week and tap <span className="text-indigo-600">Generate plan</span>.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        StudyFlow will return a list of suggested tasks with reasons. You decide
        which ones to keep.
      </p>
    </div>
  );
}

function CalIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
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
  );
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
    </svg>
  );
}
