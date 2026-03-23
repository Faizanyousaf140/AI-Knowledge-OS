"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "../../services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await forgotPassword(email);
      setMessage("If that email exists, a reset link has been sent.");
    } catch (err) {
      setMessage(err.message || "Could not process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 className="title">Forgot Password</h1>
          <p className="muted" style={{ marginTop: 8 }}>Enter your email to receive a reset link.</p>

          <form onSubmit={onSubmit} className="stack section">
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
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
