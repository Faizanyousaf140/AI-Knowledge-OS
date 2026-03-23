"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "../../services/auth.service";

function ResetPasswordContent() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const token = params.get("token");
    if (!token) {
      setMessage("Missing reset token.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await resetPassword(token, password);
      setMessage("Password reset successful. You can now login.");
    } catch (err) {
      setMessage(err.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 className="title">Reset Password</h1>
          <p className="muted" style={{ marginTop: 8 }}>Set a new password for your account.</p>

          <form onSubmit={onSubmit} className="stack section">
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Reset password"}
            </button>
          </form>

          {message ? <p className="muted">{message}</p> : null}

          <div className="section">
            <Link className="subtle-link" href="/login">Back to login</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="page-wrap">
          <div className="container">
            <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
              <h1 className="title">Reset Password</h1>
              <p className="muted" style={{ marginTop: 8 }}>Set a new password for your account.</p>
            </div>
          </div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
