
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080D18] px-5 py-16 text-slate-100">

      {/* Background glow */}
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto w-full max-w-4xl">

        {/* Heading */}
        <div className="mb-12 flex flex-col items-center text-center">

          {/* Logo placeholder */}
          <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-[26px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/20 to-slate-900 shadow-[0_0_60px_rgba(99,102,241,0.12)]">
            <svg
              width="46"
              height="46"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="7"
                y="7"
                width="34"
                height="34"
                rx="12"
                stroke="#A5B4FC"
                strokeWidth="2"
              />
              <path
                d="M15 25L21 31L33 18"
                stroke="#C4B5FD"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="36"
                cy="12"
                r="4"
                fill="#818CF8"
              />
            </svg>
          </div>

          <div className="mb-5 rounded-full border border-indigo-400/20 bg-indigo-400/5 px-4 py-1.5 text-xs font-medium tracking-[0.2em] text-indigo-300">
            AI-POWERED VIP INTELLIGENCE
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            VIP Player
            <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              Intelligence
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
            Единая платформа для AI-анализа переписок,
            контроля качества обслуживания, выявления
            рисков и управления задачами VIP-команды.
          </p>
        </div>

        {/* Platform preview */}
        <section className="mb-9 rounded-[28px] border border-white/10 bg-[#111827]/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-400">
                Platform Overview
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Intelligent VIP Operations
              </h2>
            </div>

            <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Demo Platform
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            {/* Conversations */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#192235] p-5">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>

              <p className="text-sm text-slate-400">
                Conversations
              </p>
              <p className="mt-1 text-3xl font-bold text-white">
                40
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Demo conversations
              </p>
            </div>

            {/* Risk detection */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#192235] p-5">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </div>

              <p className="text-sm text-slate-400">
                Risk Detection
              </p>
              <p className="mt-1 text-3xl font-bold text-white">
                AI
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Risk monitoring
              </p>
            </div>

            {/* Task Management */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#192235] p-5">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>

              <p className="text-sm text-slate-400">
                Task Monitoring
              </p>
              <p className="mt-1 text-3xl font-bold text-white">
                Active
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Team follow-up
              </p>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <Link
            href="/team-lead"
            className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 shadow-lg shadow-indigo-900/20 transition-all duration-200 hover:-translate-y-1 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/20"
          >
            <div>
              <p className="text-base font-semibold text-white">
                Team Lead Dashboard
              </p>
              <p className="mt-1 text-xs text-indigo-100/80">
                Analytics & Team Performance
              </p>
            </div>
            <span className="text-2xl text-white/80 transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>

          <Link
            href="/vip-manager"
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#1B263B] px-6 py-5 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-[#24324D]"
          >
            <div>
              <p className="text-base font-semibold text-white">
                VIP Manager Workspace
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Players & Task Management
              </p>
            </div>
            <span className="text-2xl text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-white">
              →
            </span>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs tracking-wide text-slate-500">
            VIP PLAYER INTELLIGENCE · AI ANALYTICS MVP
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Demonstration platform · Fictional data
          </p>
        </div>
      </div>
    </main>
  );
}
