"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="hero-grid min-h-screen px-6 py-10 md:px-10 lg:px-14">
      <section className="glass-panel mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2rem] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col justify-between p-8 md:p-12">
          <div className="space-y-6">
            <div className="inline-flex w-fit items-center rounded-full border border-emerald-900/10 bg-white/60 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-900/80">
              Real-time collaboration
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-5xl font-black leading-[0.95] text-slate-900 md:text-6xl">
                Build rooms that feel alive the moment your team joins.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                A calmer, cleaner collaboration space for creating rooms,
                inviting people, and keeping shared work moving without the
                clutter.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/auth/register")}
                className="btn-primary min-w-40"
              >
                Create account
              </button>
              <button
                onClick={() => router.push("/auth/login")}
                className="btn-ghost min-w-40"
              >
                Sign in
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="section-card rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                Rooms
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900">Create fast</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start focused spaces for planning, coding, and discussion in a
                couple of clicks.
              </p>
            </div>
            <div className="section-card rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                Access
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900">Protected flow</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Simple auth keeps room access clean while staying lightweight
                for your current stack.
              </p>
            </div>
            <div className="section-card rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Teamwork
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900">Join together</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Browse active rooms, join by ID, and keep participation visible
                to everyone.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(20,83,45,0.98),rgba(15,118,110,0.94))] p-8 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_30%)]" />
          <div className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/70">
                  Workspace preview
                </p>
                <h2 className="mt-2 text-3xl font-black">Studio board</h2>
              </div>
              <div className="rounded-full bg-white/12 px-4 py-2 text-sm font-bold">
                Live
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-[1.35rem] bg-white/12 p-4">
                <p className="text-sm text-white/70">Active room</p>
                <p className="mt-2 text-xl font-bold">Frontend Sprint</p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Visual updates, live collaboration, and room activity in one
                  focused hub.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[1.25rem] bg-black/14 p-4">
                  <p className="text-sm text-white/70">Members</p>
                  <p className="mt-2 text-3xl font-black">12</p>
                </div>
                <div className="rounded-[1.25rem] bg-black/14 p-4">
                  <p className="text-sm text-white/70">Open rooms</p>
                  <p className="mt-2 text-3xl font-black">7</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/room")}
                className="btn-secondary w-full"
              >
                Enter room dashboard
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
