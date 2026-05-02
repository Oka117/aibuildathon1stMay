import { SfShell } from "~/app/_components/sf-shell";

type Schedule = {
  time: string;
  title: string;
  meta: string;
  color: string;
};

type Deadline = {
  title: string;
  course: string;
  due: string;
  level: "High" | "Medium" | "Low";
};

const todaysSchedule: Schedule[] = [
  {
    time: "09:00",
    title: "Calculus Lecture",
    meta: "MATH 201 · 2h",
    color: "bg-indigo-500",
  },
  {
    time: "11:00",
    title: "Lab Report Work",
    meta: "CHEM 110 · 1h",
    color: "bg-emerald-500",
  },
  {
    time: "14:00",
    title: "Study Group",
    meta: "Library Room 3 · 1.5h",
    color: "bg-amber-500",
  },
  {
    time: "16:30",
    title: "Office Hours — Prof. Lee",
    meta: "Hanna Neumann 145 · 30m",
    color: "bg-rose-500",
  },
];

const deadlines: Deadline[] = [
  {
    title: "Lab Report",
    course: "Chemistry 110",
    due: "May 14, 11:59 PM",
    level: "High",
  },
  {
    title: "Problem Set 5",
    course: "Calculus 201",
    due: "May 18, 11:59 PM",
    level: "Medium",
  },
  {
    title: "Reading Reflection",
    course: "English 150",
    due: "May 20, 11:59 PM",
    level: "Low",
  },
  {
    title: "Group Presentation Slides",
    course: "COMP 3242",
    due: "May 21, 5:00 PM",
    level: "Medium",
  },
];

const weekDays = [
  { d: "Mon", n: 12 },
  { d: "Tue", n: 13 },
  { d: "Wed", n: 14 },
  { d: "Thu", n: 15 },
  { d: "Fri", n: 16 },
  { d: "Sat", n: 17 },
  { d: "Sun", n: 18 },
];

const levelStyles: Record<Deadline["level"], string> = {
  High: "bg-red-50 text-red-600 ring-red-100",
  Medium: "bg-amber-50 text-amber-700 ring-amber-100",
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export default function Home() {
  return (
    <SfShell>
      <section className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl leading-tight font-bold text-slate-900 md:text-3xl">
            Good morning, Alex <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Plan well, focus more, stress less. Here&apos;s what today looks
            like.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          Start Focus Session
        </button>
      </section>

      {/* Stat strip */}
      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Tasks today"
          value="4"
          hint="Keep going!"
          accent="emerald"
          icon={
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 12 2 2 4-4" />
              <rect x="3" y="4" width="18" height="16" rx="3" />
            </svg>
          }
        />
        <Stat
          label="Deep-work hours"
          value="3.5"
          hint="vs 2.4 yesterday"
          accent="indigo"
          icon={
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />
        <Stat
          label="Deadlines this week"
          value="6"
          hint="2 high priority"
          accent="amber"
          icon={
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <path d="M14 3v6h6" />
            </svg>
          }
        />
        <Stat
          label="Stress level"
          value="Manageable"
          hint="Balanced today"
          accent="green"
          icon={<span className="text-base">😊</span>}
        />
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-8">
          {/* Recommended Now */}
          <Card className="overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-white">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-indigo-500 uppercase">
                  Recommended Now
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  Review Lecture Notes
                </h3>
                <p className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Biology 101
                  </span>
                  <span>· 45 min · highest impact for tomorrow&apos;s quiz</span>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700">
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Start Focus Session
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">
                    Snooze 30 min
                  </button>
                </div>
              </div>
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-indigo-100/60 text-indigo-500">
                <svg
                  className="h-12 w-12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h12l4 4v12H4z" />
                  <path d="M16 4v4h4" />
                  <path d="M8 13h8M8 17h6" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Week strip */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">This week</h3>
              <span className="text-xs text-slate-400">May 12 – 18</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((d) => {
                const active = d.n === 13;
                return (
                  <button
                    key={d.n}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 transition ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold tracking-wider uppercase ${active ? "text-indigo-100" : "text-slate-400"}`}
                    >
                      {d.d}
                    </span>
                    <span className="text-base font-semibold">{d.n}</span>
                    <span
                      className={`h-1 w-1 rounded-full ${
                        d.n <= 16
                          ? active
                            ? "bg-white"
                            : "bg-indigo-400"
                          : "bg-transparent"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Today&apos;s Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  4 events · 4h 30m of class & study time
                </p>
              </div>
              <a
                href="/timetable"
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                View full timetable →
              </a>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {todaysSchedule.map((s) => (
                <li
                  key={s.title}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <div className="w-12 shrink-0 text-xs font-semibold text-slate-500">
                    {s.time}
                  </div>
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {s.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">{s.meta}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:col-span-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Upcoming Deadlines
              </h3>
              <a
                href="/tasks"
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                All →
              </a>
            </div>
            <ul className="space-y-2.5">
              {deadlines.map((d) => (
                <li
                  key={d.title}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <path d="M14 3v6h6M9 13h6M9 17h4" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {d.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {d.course} · {d.due}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${levelStyles[d.level]}`}
                  >
                    {d.level}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h4 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Weekly Progress
            </h4>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">68%</span>
              <span className="text-xs text-slate-400">17 / 25 tasks</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              On track to beat last week (62%).
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                style={{ width: "68%" }}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <h4 className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Stress Level
              </h4>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Manageable
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span aria-hidden className="text-2xl">
                😊
              </span>
              <p className="text-xs text-slate-500">
                You&apos;re in a good spot today. Keep balancing study and
                breaks.
              </p>
            </div>
            <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-400">
              <div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow ring-1 ring-slate-200"
                style={{ left: "32%" }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>Calm</span>
              <span>Balanced</span>
              <span>Overwhelmed</span>
            </div>
          </Card>
        </div>
      </section>
    </SfShell>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 ${className}`}
    >
      {children}
    </section>
  );
}

const accentMap: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
};

function Stat({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  accent: keyof typeof accentMap;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${accentMap[accent] ?? accentMap.indigo}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium tracking-wider text-slate-400 uppercase">
          {label}
        </p>
        <p className="truncate text-lg font-bold text-slate-900">{value}</p>
        <p className="truncate text-[11px] text-slate-500">{hint}</p>
      </div>
    </div>
  );
}
