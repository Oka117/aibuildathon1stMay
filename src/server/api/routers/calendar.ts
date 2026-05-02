import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { calendarStore } from "~/server/data/calendar-store";

const CreateInput = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  day: z.number().int().min(0).max(6),
  start: z.number().min(0).max(23),
  duration: z.number().min(0.5).max(12).default(1),
  source: z.enum(["suggestion", "manual"]).optional(),
});

const IdInput = z.object({ id: z.string().min(1) });

/**
 * Calendar router — events accepted onto the timetable from AI suggestions
 * (or added manually in the future).
 */
export const calendarRouter = createTRPCRouter({
  list: publicProcedure.query(() => calendarStore.list()),

  add: publicProcedure
    .input(CreateInput)
    .mutation(({ input }) => calendarStore.create(input)),

  remove: publicProcedure
    .input(IdInput)
    .mutation(({ input }) => ({ removed: calendarStore.remove(input.id) })),

  clear: publicProcedure.mutation(() => {
    calendarStore.clear();
    return { ok: true };
  }),
});
