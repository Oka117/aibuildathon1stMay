import { SfShell } from "~/app/_components/sf-shell";

export default function PlannerPage() {
  return (
    <SfShell>
      <section className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Planner
        </h1>
        <p className="text-sm text-slate-500">
          Smart weekly plan — balance lectures, study blocks, and breaks.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm ring-1 ring-slate-100">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-indigo-500 uppercase">
              Coming soon
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              AI-assisted weekly plan
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              We&apos;ll suggest study blocks based on your timetable, deadlines,
              and stress level — automatically rebalancing when assignments
              shift.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                disabled
                className="cursor-not-allowed rounded-full bg-indigo-200 px-4 py-2 text-xs font-semibold text-white"
              >
                Generate plan
              </button>
              <button className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                See sample week
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <ul className="space-y-2 text-sm text-slate-600">
            <Bullet>Pull deadlines from Tasks automatically</Bullet>
            <Bullet>Read your weekly timetable</Bullet>
            <Bullet>Suggest 2–3 study blocks per day with 5-minute breaks</Bullet>
            <Bullet>Adjust automatically when stress trends high</Bullet>
            <Bullet>Sync to Apple / Google Calendar</Bullet>
          </ul>
        </div>
      </section>
    </SfShell>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-100">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
      <span>{children}</span>
    </li>
  );
}
