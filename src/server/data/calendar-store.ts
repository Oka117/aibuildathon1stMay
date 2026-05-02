/**
 * In-memory calendar event store.
 *
 * Holds events the user has accepted onto their calendar from the AI
 * suggestions table. Kept separate from `cardStore` so the two concepts
 * (todo/draft cards vs. scheduled events) don't bleed into each other.
 *
 * Same global-singleton trick as cardStore so it survives Next.js HMR.
 */

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  /** Day of week, 0..6 → Mon..Sun (matches the timetable grid). */
  day: number;
  /** Hour 0..23. The grid renders 8..20 — events outside that clip. */
  start: number;
  /** Hours of duration (≥0.5). */
  duration: number;
  source: "suggestion" | "manual";
  createdAt: string;
};

export type CreateEventInput = {
  title: string;
  description?: string;
  day: number;
  start: number;
  duration: number;
  source?: "suggestion" | "manual";
};

type Store = {
  events: CalendarEvent[];
  counter: number;
};

const globalForStore = globalThis as unknown as { __sfCalStore?: Store };

const store: Store =
  globalForStore.__sfCalStore ??
  (globalForStore.__sfCalStore = { events: [], counter: 0 });

function nextId() {
  store.counter += 1;
  return `e_${store.counter}_${Date.now().toString(36)}`;
}

export const calendarStore = {
  list(): CalendarEvent[] {
    // Stable order by day then start so the timetable renders predictably.
    return [...store.events].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.start - b.start;
    });
  },

  create(input: CreateEventInput): CalendarEvent {
    const ev: CalendarEvent = {
      id: nextId(),
      title: input.title,
      description: input.description ?? "",
      day: clamp(input.day, 0, 6),
      start: clamp(input.start, 0, 23),
      duration: Math.max(0.5, input.duration),
      source: input.source ?? "manual",
      createdAt: new Date().toISOString(),
    };
    store.events.push(ev);
    return ev;
  },

  remove(id: string): boolean {
    const idx = store.events.findIndex((e) => e.id === id);
    if (idx < 0) return false;
    store.events.splice(idx, 1);
    return true;
  },

  clear(): void {
    store.events = [];
  },
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}
