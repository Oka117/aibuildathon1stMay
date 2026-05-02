/**
 * In-memory card store.
 *
 * A "card" can be a todo or an event. We keep this in a process-global so it
 * survives Next.js HMR in dev (same trick used by `src/server/db.ts`). Replace
 * with Prisma later by swapping the function bodies for `db.card.*` calls —
 * the public surface is intentionally identical to a typical CRUD repo.
 *
 * On first access, `cardStore.list()` (and the explicit `seedIfEmpty()`)
 * populates the store with `sampleCards` so the UI has realistic CS
 * coursework data on first paint without any user input.
 *
 * State machine
 * -------------
 *   in_progress  ↔  done
 *
 * The legacy "pending" state still exists in the type to keep older callers
 * happy, but new cards (manual + seeded) start in `in_progress` so the Tasks
 * page never shows a Pending bucket. `done` (boolean) is preserved as a
 * derived field so any older consumer that only checks `c.done` keeps
 * working.
 */

import {
  sampleCards,
  type CoverKey,
  type Priority,
  type SampleCard,
} from "~/server/data/sample-data";

export type CardType = "todo" | "event";

export type CardState = "pending" | "in_progress" | "done";

export type Card = {
  id: string;
  type: CardType;
  name: string;
  description: string;
  datetime?: string; // ISO-like "YYYY-MM-DD HH:MM"
  priority?: Priority;
  recommendReason?: string;
  /** Course code or category tag — e.g. "COMP4610", "Wellbeing". */
  tag?: string;
  /** Cover style key, used by the pomotodo-style Tasks list. */
  cover?: CoverKey;
  /** Lifecycle: in_progress ↔ done. ("pending" kept for back-compat.) */
  state: CardState;
  /** Mirrors `state === "done"` for back-compat with older consumers. */
  done: boolean;
  /** Timestamp the user moved this card into in_progress. */
  startedAt?: string;
  /** Timestamp the user completed this card. */
  completedAt?: string;
  createdAt: string;
};

export type CreateCardInput = {
  type: CardType;
  name: string;
  description?: string;
  datetime?: string;
  priority?: Priority;
  recommendReason?: string;
  tag?: string;
  cover?: CoverKey;
};

type Store = {
  cards: Card[];
  counter: number;
  seeded: boolean;
  /** Bumped whenever the seed shape changes — auto-reseeds on next access. */
  seedVersion: number;
};

/**
 * Bump this whenever sample-data.ts is restructured (e.g. switching from
 * absolute datetimes to dayOffset). The store will discard old seed data
 * and re-populate the next time `list()` is called.
 */
const SEED_VERSION = 2;

const globalForStore = globalThis as unknown as { __sfStore?: Store };

const store: Store = (() => {
  const existing = globalForStore.__sfStore;
  if (existing && existing.seedVersion === SEED_VERSION) return existing;
  const fresh: Store = {
    cards: [],
    counter: 0,
    seeded: false,
    seedVersion: SEED_VERSION,
  };
  globalForStore.__sfStore = fresh;
  return fresh;
})();

function nextId() {
  store.counter += 1;
  return `c_${store.counter}_${Date.now().toString(36)}`;
}

/** Format a Date as our standard "YYYY-MM-DD HH:MM" string in local time. */
function formatLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

/**
 * Resolve a SampleCard's `dayOffset + time` into an absolute datetime
 * relative to "now". This is what makes seeded cards always land in the
 * current week, regardless of the calendar date.
 */
function resolveSampleDatetime(s: SampleCard): string {
  const today = new Date();
  const target = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + s.dayOffset,
  );
  const [h, m] = s.time.split(":");
  target.setHours(Number(h ?? 9), Number(m ?? 0), 0, 0);
  return formatLocal(target);
}

/**
 * Convert a SampleCard from sample-data.ts into a fully-formed Card.
 * We still go through nextId / new Date so seeded cards look identical
 * to user-created ones.
 */
function fromSample(s: SampleCard): Card {
  const datetime = resolveSampleDatetime(s);
  return {
    id: nextId(),
    type: "event",
    name: s.name,
    description: s.description,
    datetime,
    priority: s.priority,
    recommendReason: s.recommendReason,
    tag: s.tag,
    cover: s.cover,
    state: "in_progress",
    done: false,
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

function seedIfEmpty() {
  if (store.seeded) return;
  store.seeded = true;
  if (store.cards.length === 0) {
    for (const s of sampleCards) {
      store.cards.push(fromSample(s));
    }
  }
}

/**
 * Sort: in_progress first, then pending (rare), then done. Within each
 * bucket, cards with a datetime sort by datetime ascending; cards without
 * a datetime fall back to createdAt newest-first.
 */
function stateRank(s: CardState): number {
  if (s === "in_progress") return 0;
  if (s === "pending") return 1;
  return 2;
}

export const cardStore = {
  /** Force-seed the store. Called by routers that want guaranteed data. */
  seedIfEmpty,

  list(): Card[] {
    seedIfEmpty();
    return [...store.cards].sort((a, b) => {
      const ra = stateRank(a.state);
      const rb = stateRank(b.state);
      if (ra !== rb) return ra - rb;
      const da = a.datetime ?? "";
      const db = b.datetime ?? "";
      if (da && db) return da.localeCompare(db);
      if (da && !db) return -1;
      if (!da && db) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  },

  get(id: string): Card | undefined {
    return store.cards.find((c) => c.id === id);
  },

  create(input: CreateCardInput): Card {
    // New cards skip "pending" entirely — they start ready-to-go.
    const card: Card = {
      id: nextId(),
      type: input.type,
      name: input.name,
      description: input.description ?? "",
      datetime: input.datetime,
      priority: input.priority,
      recommendReason: input.recommendReason,
      tag: input.tag,
      cover: input.cover,
      state: "in_progress",
      done: false,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    store.cards.push(card);
    return card;
  },

  update(id: string, patch: Partial<Omit<Card, "id" | "createdAt">>): Card | null {
    const idx = store.cards.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    const existing = store.cards[idx]!;
    const next: Card = { ...existing, ...patch };
    // Keep `done` in sync if state was patched.
    if (patch.state) next.done = patch.state === "done";
    store.cards[idx] = next;
    return next;
  },

  /**
   * Explicit state setter. The Tasks UI calls this when the user clicks
   * Complete or Reopen.
   */
  setState(id: string, state: CardState): Card | null {
    const c = store.cards.find((x) => x.id === id);
    if (!c) return null;
    c.state = state;
    c.done = state === "done";
    if (state === "in_progress" && !c.startedAt) {
      c.startedAt = new Date().toISOString();
    }
    if (state === "done") {
      c.completedAt = new Date().toISOString();
    }
    if (state === "pending") {
      c.startedAt = undefined;
      c.completedAt = undefined;
    }
    return c;
  },

  /**
   * Legacy toggle — used by older callers (planner page, timetable). Cycles
   * in_progress ↔ done, preserving the original two-state contract.
   */
  toggleDone(id: string): Card | null {
    const c = store.cards.find((x) => x.id === id);
    if (!c) return null;
    if (c.state === "done") {
      c.state = "in_progress";
      c.done = false;
      c.completedAt = undefined;
    } else {
      c.state = "done";
      c.done = true;
      c.completedAt = new Date().toISOString();
    }
    return c;
  },

  remove(id: string): boolean {
    const idx = store.cards.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    store.cards.splice(idx, 1);
    return true;
  },

  clear(): void {
    store.cards = [];
    store.seeded = true; // don't auto-reseed after a deliberate clear
  },

  /** Reset to seeded sample data (useful for the "demo reset" button). */
  reset(): void {
    store.cards = [];
    store.seeded = false;
    seedIfEmpty();
  },
};
