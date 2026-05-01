"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Protected({ children }) {
  const router = useRouter();
  const isAuth =
    typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

  useEffect(() => {
    if (!isAuth) {
      router.push("/auth/login");
    }
  }, [isAuth, router]);

  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-[1.75rem] px-8 py-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Secure area
          </p>
          <p className="mt-3 text-lg font-bold text-slate-900">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
