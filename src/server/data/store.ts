/**
 * In-memory card store.
 *
 * A "card" can be a todo or an event. We keep this in a process-global so it
 * survives Next.js HMR in dev (same trick used by `src/server/db.ts`). Replace
 * with Prisma later by swapping the function bodies for `db.card.*` calls —
 * the public surface is intentionally identical to a typical CRUD repo.
 */

import type { Priority } from "~/server/data/sample-data";

export type CardType = "todo" | "event";

export type Card = {
  id: string;
  type: CardType;
  name: string;
  description: string;
  datetime?: string; // ISO-like "YYYY-MM-DD HH:MM"
  priority?: Priority;
  recommendReason?: string;
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
};

type Store = {
  cards: Card[];
  counter: number;
};

const globalForStore = globalThis as unknown as { __sfStore?: Store };

const store: Store =
  globalForStore.__sfStore ??
  (globalForStore.__sfStore = { cards: [], counter: 0 });

function nextId() {
  store.counter += 1;
  return `c_${store.counter}_${Date.now().toString(36)}`;
}

export const cardStore = {
  list(): Card[] {
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
  },
};
