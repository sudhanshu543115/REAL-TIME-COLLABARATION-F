"use client";

import { useRegisterMutation } from "../../../src/store/api/authApi";
import { useRouter } from "next/navigation";

export default function Register() {
  const [register, { isLoading, isSuccess, error }] = useRegisterMutation();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      await register(data).unwrap();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/45 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex items-center p-6 md:p-10">
          <div className="section-card w-full rounded-[1.8rem] p-7 md:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Register
              </p>
              <h1 className="mt-3 text-3xl font-black text-slate-900">
                Create your workspace identity
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Set up your account to create rooms, join teams, and manage
                collaboration from one place.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="ui-label">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="ui-input"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="ui-label">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="ui-input"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="ui-label">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  className="ui-input"
                  placeholder="Choose a secure password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? "Registering..." : "Create account"}
              </button>
            </form>

            {isSuccess && (
              <p className="status-success mt-5">
                Registered successfully. You can sign in now.
              </p>
            )}

            {error && (
              <p className="status-error mt-5">
                Something went wrong while creating your account.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="btn-ghost"
              >
                Already have an account?
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-sm font-semibold text-slate-500 transition hover:text-slate-800"
              >
                Back to home
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,#f59e0b_0%,#b45309_100%)] p-8 text-white md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">
            Team onboarding
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight">
            Launch new rooms with a warmer, clearer first impression.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-white/80">
            Registration is the front door for the app, so this page now feels
            intentional and aligned with the rest of the product.
          </p>

          <div className="mt-10 grid gap-4">
            <div className="rounded-[1.4rem] border border-white/20 bg-white/12 p-5">
              <p className="text-sm text-white/70">Profile setup</p>
              <p className="mt-2 text-2xl font-bold">Ready in seconds</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/20 bg-black/10 p-5">
              <p className="text-sm text-white/70">Purpose-built</p>
              <p className="mt-2 text-base leading-7 text-white/80">
                Designed to match the landing page and room dashboard instead
                of looking like a separate demo screen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
