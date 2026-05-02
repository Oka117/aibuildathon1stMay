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
 */

import {
  sampleCards,
  type CoverKey,
  type Priority,
  type SampleCard,
} from "~/server/data/sample-data";

export type CardType = "todo" | "event";

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
  done: boolean;
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
};

const globalForStore = globalThis as unknown as { __sfStore?: Store };

const store: Store =
  globalForStore.__sfStore ??
  (globalForStore.__sfStore = { cards: [], counter: 0, seeded: false });

function nextId() {
  store.counter += 1;
  return `c_${store.counter}_${Date.now().toString(36)}`;
}

/**
 * Convert a SampleCard from sample-data.ts into a fully-formed Card.
 * We still go through nextId / new Date so seeded cards look identical
 * to user-created ones.
 */
function fromSample(s: SampleCard): Card {
  return {
    id: nextId(),
    type: "event",
    name: s.name,
    description: s.description,
    datetime: s.datetime,
    priority: s.priority,
    recommendReason: s.recommendReason,
    tag: s.tag,
    cover: s.cover,
    done: false,
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

export const cardStore = {
  /** Force-seed the store. Called by routers that want guaranteed data. */
  seedIfEmpty,

  list(): Card[] {
    seedIfEmpty();
    // Newest first, but undone before done
    return [...store.cards].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  },

  get(id: string): Card | undefined {
    return store.cards.find((c) => c.id === id);
  },

  create(input: CreateCardInput): Card {
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
      done: false,
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
    store.cards[idx] = next;
    return next;
  },

  toggleDone(id: string): Card | null {
    const c = store.cards.find((c) => c.id === id);
    if (!c) return null;
    c.done = !c.done;
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
