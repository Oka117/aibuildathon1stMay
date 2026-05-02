"use client";

import { useMemo, useState } from "react";
import { SfShell } from "~/app/_components/sf-shell";
import { api } from "~/trpc/react";

type Priority = "high" | "medium" | "low";
type CardType = "todo" | "event";
type CardState = "pending" | "in_progress" | "done";
type CoverKey =
  | "skyline"
  | "mountain"
  | "campus"
  | "night"
  | "library"
  | "ocean"
  | "forest";

type CardLike = {
  id: string;
  type: CardType;
  name: string;
  description: string;
  datetime?: string | null;
  priority?: Priority | null;
  recommendReason?: string | null;
  tag?: string | null;
  cover?: CoverKey | null;
  state: CardState;
  done: boolean;
  createdAt: string;
};

type FilterId = "all" | "pending" | "in_progress" | "done";

const filters: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Completed" },
];

/**
 * Pomotodo-style cover gradients. Each entry is a CSS background applied to
 * the right portion of the banner. We avoid external image URLs so the demo
 * works fully offline.
 */
const coverStyles: Record<CoverKey, { gradient: string; tint: string }> = {
  skyline: {
    gradient:
      "linear-gradient(135deg, #cfe9f5 0%, #93c8e6 45%, #66a8cf 100%)",
    tint: "from-cyan-200/60",
  },
  mountain: {
    gradient:
      "linear-gradient(135deg, #cfe6f5 0%, #88b9d8 45%, #486f8f 100%)",
    tint: "from-sky-200/60",
  },
  campus: {
    gradient:
      "linear-gradient(135deg, #d8ecf7 0%, #a4cce5 45%, #5b8aac 100%)",
    tint: "from-sky-200/60",
  },
  night: {
    gradient:
      "linear-gradient(135deg, #2e3f6e 0%, #4d6792 45%, #7592bb 100%)",
    tint: "from-indigo-300/60",
  },
  library: {
    gradient:
      "linear-gradient(135deg, #e0d5c4 0%, #b9a98c 45%, #806c4d 100%)",
    tint: "from-amber-200/60",
  },
  ocean: {
    gradient:
      "linear-gradient(135deg, #c1e0ec 0%, #7ab1c8 45%, #3d7793 100%)",
    tint: "from-cyan-200/60",
  },
  forest: {
    gradient:
      "linear-gradient(135deg, #cfe6cf 0%, #88b88c 45%, #4a7c50 100%)",
    tint: "from-emerald-200/60",
  },
};

const COVER_FALLBACK_ROTATION: CoverKey[] = [
  "skyline",
  "mountain",
  "campus",
  "night",
  "library",
  "ocean",
  "forest",
];

/**
 * Pick a cover for a card. Honors `c.cover` if set; otherwise derives a
 * deterministic one from the index so reloads stay stable.
 */
function pickCover(c: CardLike, i: number): CoverKey {
  if (c.cover) return c.cover;
  return (
    COVER_FALLBACK_ROTATION[i % COVER_FALLBACK_ROTATION.length] ?? "skyline"
  );
}

export default function TasksPage() {
  const utils = api.useUtils();

  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  // Detailed-add modal state (the header "+ New task" button opens this).
  const [modalOpen, setModalOpen] = useState(false);
  const [mName, setMName] = useState("");
  const [mDescription, setMDescription] = useState("");
  const [mTag, setMTag] = useState("");
  const [mPriority, setMPriority] = useState<Priority>("medium");
  const [mDate, setMDate] = useState(""); // YYYY-MM-DD
  const [mTime, setMTime] = useState(""); // HH:MM
  const [mError, setMError] = useState<string | null>(null);

  // ── Server data ────────────────────────────────────────────────────────────
  const cardsQuery = api.card.list.useQuery();
  const create = api.card.create.useMutation({
    onSuccess: () => utils.card.list.invalidate(),
  });
  const setStateMut = api.card.setState.useMutation({
    onSuccess: () => utils.card.list.invalidate(),
  });
  const removeMut = api.card.remove.useMutation({
    onSuccess: () => utils.card.list.invalidate(),
  });

  const cards = useMemo<CardLike[]>(
    () => (cardsQuery.data ?? []) as CardLike[],
    [cardsQuery.data],
  );

  const counts = useMemo(() => {
    return {
      all: cards.length,
      pending: cards.filter((c) => c.state === "pending").length,
      in_progress: cards.filter((c) => c.state === "in_progress").length,
      done: cards.filter((c) => c.state === "done").length,
    } satisfies Record<FilterId, number>;
  }, [cards]);

  const visible = useMemo(() => {
    return cards
      .filter((c) => {
        if (filter === "all") return true;
        if (filter === "pending") return c.state === "pending";
        if (filter === "in_progress") return c.state === "in_progress";
        return c.state === "done";
      })
      .filter((c) =>
        query.trim()
          ? c.name.toLowerCase().includes(query.trim().toLowerCase()) ||
            (c.description ?? "")
              .toLowerCase()
              .includes(query.trim().toLowerCase()) ||
            (c.tag ?? "").toLowerCase().includes(query.trim().toLowerCase())
          : true,
      );
  }, [cards, filter, query]);

  function advance(c: CardLike) {
    // Three-state cycle: pending → in_progress → done → in_progress.
    let next: CardState;
    if (c.state === "pending") next = "in_progress";
    else if (c.state === "in_progress") next = "done";
    else next = "in_progress";
    setStateMut.mutate({ id: c.id, state: next });
  }

  function addTask() {
    const title = draft.trim();
    if (!title) return;
    create.mutate(
      { type: "event", name: title, priority: "medium" },
      { onSuccess: () => setDraft("") },
    );
  }

  function resetModal() {
    setMName("");
    setMDescription("");
    setMTag("");
    setMPriority("medium");
    setMDate("");
    setMTime("");
    setMError(null);
  }

  function openModal() {
    resetModal();
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    resetModal();
  }

  function submitModal(e: React.FormEvent) {
    e.preventDefault();
    if (!mName.trim()) {
      setMError("Name is required.");
      return;
    }
    const datetime =
      mDate && mTime ? `${mDate} ${mTime}` : mDate ? `${mDate} 09:00` : undefined;
    create.mutate(
      {
        type: "event",
        name: mName.trim(),
        description: mDescription.trim() || undefined,
        tag: mTag.trim() || undefined,
        priority: mPriority,
        datetime,
      },
      {
        onSuccess: () => closeModal(),
        onError: (err) => setMError(err.message),
      },
    );
  }

  return (
    <SfShell>
      {/* Header row — title + add control */}
      <header className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            New tasks land in{" "}
            <span className="font-semibold text-slate-700">Pending</span>. Click{" "}
            <span className="font-semibold text-sky-700">Start</span> to begin,{" "}
            <span className="font-semibold text-emerald-700">Complete</span> to
            finish.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/75 px-3 py-2 shadow-sm ring-1 ring-white/60 backdrop-blur lg:w-80 lg:flex-none">
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
              placeholder="Search tasks"
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-sky-700"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New task
          </button>
        </div>
      </header>

      {/* Filter chips */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-2">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <li key={f.id}>
                <button
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-white text-sky-700 shadow ring-1 ring-white/70"
                      : "bg-white/55 text-slate-700 ring-1 ring-white/60 hover:bg-white/75"
                  }`}
                >
                  {f.label}
                  <span
                    className={`ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      active
                        ? "bg-sky-100 text-sky-700"
                        : "bg-white/70 text-slate-600"
                    }`}
                  >
                    {counts[f.id]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="text-xs text-slate-600">
          {visible.length} item{visible.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Inline add bar */}
      <div className="mb-6 flex items-center gap-2 rounded-2xl bg-white/75 px-3 py-2 shadow-sm ring-1 ring-white/60 backdrop-blur">
        <button
          onClick={addTask}
          className="grid h-7 w-7 place-items-center rounded-full bg-sky-600 text-white shadow-sm hover:bg-sky-700"
          aria-label="Add"
        >
          <svg
            className="h-4 w-4"
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
          disabled={create.isPending || !draft.trim()}
          className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {create.isPending ? "Adding…" : "Add"}
        </button>
      </div>

      {/* Banner card grid */}
      {cardsQuery.isLoading ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-white/40"
            />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/65 py-16 text-slate-600 backdrop-blur">
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
          <p className="mt-2 text-sm font-medium">Nothing to show here</p>
          <p className="text-[11px] text-slate-500">
            {cards.length === 0
              ? "Generate a plan or add a task to get started."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((c, i) => (
            <BannerCard
              key={c.id}
              card={c}
              cover={pickCover(c, i)}
              onAdvance={() => advance(c)}
              onRemove={() => removeMut.mutate({ id: c.id })}
            />
          ))}
        </ul>
      )}

      {/* Detailed "New task" modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-30 grid place-items-center bg-slate-900/30 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <form
            onSubmit={submitModal}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  New task
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Capture the details — they save straight to your task list.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
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
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <label className="mt-4 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Name
            </label>
            <input
              autoFocus
              value={mName}
              onChange={(e) => setMName(e.target.value)}
              required
              placeholder="Finish lab report"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />

            <label className="mt-3 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Description (optional)
            </label>
            <textarea
              value={mDescription}
              onChange={(e) => setMDescription(e.target.value)}
              rows={2}
              placeholder="Add a short note…"
              className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Tag
                </label>
                <input
                  value={mTag}
                  onChange={(e) => setMTag(e.target.value)}
                  placeholder="COMP4610"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Priority
                </label>
                <select
                  value={mPriority}
                  onChange={(e) =>
                    setMPriority(e.target.value as Priority)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Date
                </label>
                <input
                  type="date"
                  value={mDate}
                  onChange={(e) => setMDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Time
                </label>
                <input
                  type="time"
                  value={mTime}
                  onChange={(e) => setMTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {mError && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 ring-1 ring-rose-100">
                {mError}
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending || !mName.trim()}
                className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
              >
                {create.isPending ? "Adding…" : "Create task"}
              </button>
            </div>
          </form>
        </div>
      )}
    </SfShell>
  );
}

function BannerCard({
  card,
  cover,
  onAdvance,
  onRemove,
}: {
  card: CardLike;
  cover: CoverKey;
  onAdvance: () => void;
  onRemove: () => void;
}) {
  const style = coverStyles[cover];
  const tag = card.tag ?? "Task";

  // Three-state UI: pending → "Start" (begin), in_progress → "Complete",
  // done → "Reopen". This matches the lifecycle the rest of the app uses.
  const action =
    card.state === "done"
      ? { label: "Reopen", color: "bg-white/15 hover:bg-white/30" }
      : card.state === "pending"
        ? {
            label: "Start",
            color: "bg-sky-500/80 hover:bg-sky-500",
          }
        : {
            label: "Complete",
            color: "bg-emerald-500/80 hover:bg-emerald-500",
          };

  const stateBadge =
    card.state === "done"
      ? "Completed"
      : card.state === "pending"
        ? "Pending"
        : "In progress";

  return (
    <li
      className="group relative flex h-32 items-stretch overflow-hidden rounded-2xl shadow-md ring-1 ring-white/40 transition hover:shadow-lg"
      style={{ background: style.gradient }}
    >
      {/* Decorative tint + scenery on the right */}
      <span
        className={`pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l ${style.tint} to-transparent`}
      />
      <SceneArt cover={cover} />

      {/* Left text block */}
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col justify-center px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-xl font-bold drop-shadow-sm ${
              card.state === "done" ? "line-through opacity-60" : ""
            }`}
          >
            {card.name}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/85">
          <span className="rounded-full bg-white/25 px-2 py-0.5 font-semibold backdrop-blur">
            {tag}
          </span>
          <span className="rounded-full bg-white/25 px-2 py-0.5 font-semibold backdrop-blur">
            {stateBadge}
          </span>
          {card.priority && (
            <span className="rounded-full bg-white/25 px-2 py-0.5 font-semibold capitalize backdrop-blur">
              {card.priority}
            </span>
          )}
        </div>
        {card.description && (
          <p className="mt-1 line-clamp-2 max-w-md text-xs text-white/85">
            {card.description}
          </p>
        )}
        {card.datetime && (
          <p className="mt-1 text-[11px] text-white/75">{card.datetime}</p>
        )}
      </div>

      {/* Right action button */}
      <button
        onClick={onAdvance}
        className={`relative z-[1] flex shrink-0 items-center justify-center px-6 text-white transition ${action.color}`}
        aria-label={action.label.toLowerCase()}
      >
        <span className="text-lg font-bold tracking-wide drop-shadow lg:text-xl">
          {action.label}
        </span>
      </button>

      {/* Remove button — desktop hover-reveal */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 z-[2] hidden h-7 w-7 place-items-center rounded-full bg-white/40 text-white backdrop-blur transition hover:bg-white/70 hover:text-rose-600 group-hover:grid"
        aria-label="remove"
        title="Remove"
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
    </li>
  );
}

/**
 * Tiny inline SVG decorations for each cover style. We render them on the
 * right half of the banner to evoke the pomotodo-style photo cards while
 * staying fully self-contained (no external assets).
 */
function SceneArt({ cover }: { cover: CoverKey }) {
  switch (cover) {
    case "skyline":
      return (
        <svg
          className="pointer-events-none absolute right-0 bottom-0 h-full w-2/3 text-white/30"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
        >
          <rect x="100" y="30" width="14" height="50" fill="currentColor" />
          <rect x="118" y="20" width="18" height="60" fill="currentColor" opacity="0.85" />
          <rect x="140" y="38" width="12" height="42" fill="currentColor" opacity="0.7" />
          <rect x="156" y="28" width="20" height="52" fill="currentColor" opacity="0.9" />
          <rect x="180" y="44" width="14" height="36" fill="currentColor" opacity="0.6" />
        </svg>
      );
    case "mountain":
      return (
        <svg
          className="pointer-events-none absolute right-0 bottom-0 h-full w-2/3 text-white/35"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
        >
          <polygon points="80,80 130,30 180,80" fill="currentColor" opacity="0.85" />
          <polygon points="120,80 160,40 200,80" fill="currentColor" opacity="0.65" />
        </svg>
      );
    case "campus":
      return (
        <svg
          className="pointer-events-none absolute right-0 bottom-0 h-full w-2/3 text-white/35"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
        >
          <rect x="110" y="40" width="40" height="40" fill="currentColor" opacity="0.85" />
          <polygon points="105,40 130,22 155,40" fill="currentColor" />
          <rect x="160" y="50" width="30" height="30" fill="currentColor" opacity="0.7" />
        </svg>
      );
    case "night":
      return (
        <svg
          className="pointer-events-none absolute right-0 bottom-0 h-full w-2/3 text-white/35"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
        >
          <circle cx="160" cy="22" r="6" fill="currentColor" opacity="0.8" />
          <rect x="100" y="42" width="14" height="38" fill="currentColor" opacity="0.7" />
          <rect x="118" y="30" width="18" height="50" fill="currentColor" opacity="0.85" />
          <rect x="140" y="48" width="12" height="32" fill="currentColor" opacity="0.6" />
          <rect x="156" y="38" width="20" height="42" fill="currentColor" opacity="0.8" />
        </svg>
      );
    case "library":
      return (
        <svg
          className="pointer-events-none absolute right-0 bottom-0 h-full w-2/3 text-white/35"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
        >
          <rect x="110" y="38" width="6" height="42" fill="currentColor" />
          <rect x="118" y="30" width="6" height="50" fill="currentColor" opacity="0.85" />
          <rect x="126" y="42" width="6" height="38" fill="currentColor" opacity="0.7" />
          <rect x="134" y="34" width="6" height="46" fill="currentColor" />
          <rect x="142" y="28" width="6" height="52" fill="currentColor" opacity="0.85" />
          <rect x="150" y="36" width="6" height="44" fill="currentColor" opacity="0.7" />
          <rect x="158" y="32" width="6" height="48" fill="currentColor" />
        </svg>
      );
    case "ocean":
      return (
        <svg
          className="pointer-events-none absolute right-0 bottom-0 h-full w-2/3 text-white/35"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
        >
          <path
            d="M90 60 Q110 50 130 60 T170 60 T210 60 V80 H90 Z"
            fill="currentColor"
            opacity="0.7"
          />
          <path
            d="M90 70 Q110 62 130 70 T170 70 T210 70 V80 H90 Z"
            fill="currentColor"
          />
        </svg>
      );
    case "forest":
      return (
        <svg
          className="pointer-events-none absolute right-0 bottom-0 h-full w-2/3 text-white/35"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
        >
          <polygon points="105,80 120,40 135,80" fill="currentColor" opacity="0.85" />
          <polygon points="130,80 150,30 170,80" fill="currentColor" />
          <polygon points="160,80 180,45 200,80" fill="currentColor" opacity="0.7" />
        </svg>
      );
  }
}
