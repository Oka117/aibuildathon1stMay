import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { cardStore } from "~/server/data/store";

const PriorityEnum = z.enum(["high", "medium", "low"]);
const TypeEnum = z.enum(["todo", "event"]);
const StateEnum = z.enum(["pending", "in_progress", "done"]);
const CoverEnum = z.enum([
  "skyline",
  "mountain",
  "campus",
  "night",
  "library",
  "ocean",
  "forest",
]);

const CreateInput = z.object({
  type: TypeEnum,
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
  datetime: z.string().max(40).optional(),
  priority: PriorityEnum.optional(),
  recommendReason: z.string().max(500).optional(),
  tag: z.string().max(40).optional(),
  cover: CoverEnum.optional(),
});

const IdInput = z.object({ id: z.string().min(1) });
const SetStateInput = IdInput.extend({ state: StateEnum });

const UpdateInput = IdInput.extend({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  datetime: z.string().max(40).optional(),
  priority: PriorityEnum.optional(),
  recommendReason: z.string().max(500).optional(),
  tag: z.string().max(40).optional(),
  cover: CoverEnum.optional(),
  state: StateEnum.optional(),
  done: z.boolean().optional(),
});

/**
 * Public CRUD for "cards" (todo or event). We use publicProcedure so the
 * prototype works without any auth set up. Swap to protectedProcedure once
 * NextAuth is wired up to a real provider.
 */
export const cardRouter = createTRPCRouter({
  list: publicProcedure.query(() => cardStore.list()),

  create: publicProcedure
    .input(CreateInput)
    .mutation(({ input }) => cardStore.create(input)),

  update: publicProcedure.input(UpdateInput).mutation(({ input }) => {
    const { id, ...patch } = input;
    return cardStore.update(id, patch);
  }),

  /** Lifecycle setter — pending → in_progress → done. */
  setState: publicProcedure
    .input(SetStateInput)
    .mutation(({ input }) => cardStore.setState(input.id, input.state)),

  /** Legacy toggle: pending ↔ done. Kept for the planner / timetable UIs. */
  toggleDone: publicProcedure
    .input(IdInput)
    .mutation(({ input }) => cardStore.toggleDone(input.id)),

  remove: publicProcedure
    .input(IdInput)
    .mutation(({ input }) => ({ removed: cardStore.remove(input.id) })),

  clear: publicProcedure.mutation(() => {
    cardStore.clear();
    return { ok: true };
  }),

  reset: publicProcedure.mutation(() => {
    cardStore.reset();
    return { ok: true };
  }),
});
