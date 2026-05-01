"use client";

import { useLoginMutation } from "../../../src/store/api/authApi";
import { useRouter } from "next/navigation";

export default function Login() {
  const [login, { isLoading, error }] = useLoginMutation();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const res = await login(data).unwrap();

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      router.push("/room");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/45 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[linear-gradient(180deg,#1f7a53_0%,#14532d_100%)] p-8 text-white md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Welcome back
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight">
            Sign in and return to your collaboration rooms.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/78">
            Access your active spaces, join teammates quickly, and manage rooms
            from one clean dashboard.
          </p>

          <div className="mt-10 space-y-4">
            <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-5">
              <p className="text-sm text-white/70">Quick access</p>
              <p className="mt-2 text-2xl font-bold">Token-based login</p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                Simple auth flow wired to your backend so room access stays
                protected.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="btn-ghost w-full border-white/20 bg-white/12 text-white"
            >
              Need an account? Register
            </button>
          </div>
        </div>

        <div className="flex items-center p-6 md:p-10">
          <div className="section-card w-full rounded-[1.8rem] p-7 md:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Login
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">
                Enter your account
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use the email and password you registered with.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            {error && (
              <p className="status-error mt-5">
                Invalid email or password. Please try again.
              </p>
            )}

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-5 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
            >
              Back to home
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
