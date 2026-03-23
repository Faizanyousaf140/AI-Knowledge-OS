"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail } from "../../services/auth.service";

function VerifyEmailContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("Missing verification token.");
      return;
    }

    verifyEmail(token)
      .then(() => setStatus("Email verified successfully. You can now login."))
      .catch((err) => setStatus(err.message || "Verification failed."));
  }, [params]);

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 className="title">Email Verification</h1>
          <p className="muted" style={{ marginTop: 8 }}>{status}</p>
          <div className="section">
            <Link className="subtle-link" href="/login">Go to Login</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="page-wrap">
          <div className="container">
            <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
              <h1 className="title">Email Verification</h1>
              <p className="muted" style={{ marginTop: 8 }}>Verifying...</p>
            </div>
          </div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
