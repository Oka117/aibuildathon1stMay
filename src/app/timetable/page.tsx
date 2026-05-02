import { SfShell } from "~/app/_components/sf-shell";

type Block = {
  day: number; // 0..6 -> Mon..Sun
  start: number; // hour 8..22
  duration: number; // hours
  title: string;
  type: string;
  room: string;
  color: string;
};

const days = [
  "27/4 (Mon)",
  "28/4 (Tue)",
  "29/4 (Wed)",
  "30/4 (Thu)",
  "1/5 (Fri)",
  "2/5 (Sat)",
  "3/5 (Sun)",
];

const hours = Array.from({ length: 13 }, (_, i) => 8 + i); // 8 AM .. 8 PM

const blocks: Block[] = [
  {
    day: 1,
    start: 13,
    duration: 1,
    title: "COMP4610",
    type: "Lecture 01",
    room: "Sem Rm 1 (3.07), Sci Tch Bldg 136",
    color: "bg-indigo-100 text-indigo-700 border-indigo-300",
  },
  {
    day: 1,
    start: 16,
    duration: 1,
    title: "COMP3242",
    type: "Lecture 01",
    room: "Cinema Rm",
    color: "bg-rose-100 text-rose-700 border-rose-300",
  },
  {
    day: 2,
    start: 18,
    duration: 1,
    title: "COMP2620",
    type: "Lecture 01",
    room: "Lec Theatre HC",
    color: "bg-sky-100 text-sky-700 border-sky-300",
  },
  {
    day: 3,
    start: 11,
    duration: 2,
    title: "COMP3242",
    type: "Workshop 06",
    room: "Comp Lab 1.23, Hanna Neumann 145",
    color: "bg-rose-100 text-rose-700 border-rose-300",
  },
  {
    day: 3,
    start: 13,
    duration: 1,
    title: "COMP2620",
    type: "Lecture 01",
    room: "Lec Theatre HC",
    color: "bg-sky-100 text-sky-700 border-sky-300",
  },
  {
    day: 3,
    start: 17,
    duration: 1,
    title: "COMP4610",
    type: "Computer Lab 03",
    room: "Rms NI15/N116, Skaife Darius 108",
    color: "bg-indigo-100 text-indigo-700 border-indigo-300",
  },
  {
    day: 4,
    start: 13,
    duration: 1,
    title: "COMP2620",
    type: "Lecture 01",
    room: "Lec Theatre HC",
    color: "bg-sky-100 text-sky-700 border-sky-300",
  },
  {
    day: 4,
    start: 16,
    duration: 1,
    title: "COMP2620",
    type: "Tutorial 13-P1",
    room: "Rm 5.05, Marie Reay 155",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
];

const HOUR_HEIGHT = 64; // px

export default function TimetablePage() {
  return (
    <SfShell>
      <section className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Timetable
          </h1>
          <p className="text-sm text-slate-500">
            Week of 27 April – 3 May · Semester 1, 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
            Today
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <button className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">
            + Add event
          </button>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {/* Day header */}
        <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
          <div className="px-2 py-3 text-center"></div>
          {days.map((d, i) => (
            <div
              key={d}
              className={`px-2 py-3 text-center ${
                i >= 5 ? "bg-amber-50/70 text-amber-700" : ""
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="sf-scroll overflow-x-auto">
          <div className="relative grid min-w-[900px] grid-cols-[64px_repeat(7,minmax(0,1fr))]">
            {/* Hour labels column */}
            <div className="flex flex-col">
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex items-start justify-end border-b border-slate-100 pt-1 pr-2 text-[11px] text-slate-400"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d, dayIndex) => (
              <div
                key={d}
                className={`relative border-l border-slate-100 ${
                  dayIndex >= 5 ? "bg-amber-50/40" : ""
                }`}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="border-b border-slate-100"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}

                {blocks
                  .filter((b) => b.day === dayIndex)
                  .map((b, i) => {
                    const top = (b.start - hours[0]!) * HOUR_HEIGHT + 2;
                    const height = b.duration * HOUR_HEIGHT - 4;
                    return (
                      <div
                        key={`${b.title}-${i}`}
                        className={`absolute right-1.5 left-1.5 overflow-hidden rounded-lg border px-2 py-1.5 text-[11px] leading-tight shadow-sm ${b.color}`}
                        style={{ top, height }}
                      >
                        <p className="truncate text-xs font-semibold">
                          {b.title}
                        </p>
                        <p className="truncate opacity-80">{b.type}</p>
                        <p className="truncate text-[10px] opacity-70">
                          {b.room}
                        </p>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Legend color="bg-indigo-300" label="COMP4610 — AI" />
        <Legend color="bg-rose-300" label="COMP3242 — Studio" />
        <Legend color="bg-sky-300" label="COMP2620 — Logic" />
        <Legend color="bg-emerald-300" label="Tutorials" />
      </div>
    </SfShell>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="truncate text-slate-600">{label}</span>
    </div>
  );
}

function formatHour(h: number) {
  const period = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display} ${period}`;
}
