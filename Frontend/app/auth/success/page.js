"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OAuthSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/auth/success");
    }
    router.replace("/dashboard");
  }, [params, router]);

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card">
          <h1 className="title">Signing you in...</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Completing OAuth login and redirecting to dashboard.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function OAuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="page-wrap">
          <div className="container">
            <div className="card">
              <h1 className="title">Signing you in...</h1>
              <p className="muted" style={{ marginTop: 8 }}>
                Completing OAuth login and redirecting to dashboard.
              </p>
            </div>
          </div>
        </main>
      }
    >
      <OAuthSuccessContent />
    </Suspense>
  );
}
