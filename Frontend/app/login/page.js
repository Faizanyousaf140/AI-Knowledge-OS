"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser, startOAuth } from '../../services/auth.service';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser(email, password);
      // loginUser stored tokens; redirect
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider) => {
    try {
      const data = await startOAuth(provider);
      if (data && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      alert((data && data.message) || `Social login for ${provider} responded.`);
    } catch (err) {
      alert(`Could not contact server for ${provider} login: ${err.message || err}`);
    }
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1 className="title" style={{ fontSize: "2rem" }}>
            Login
          </h1>
          <p className="muted">Sign in to connect with your AI Knowledge OS backend.</p>

          <form onSubmit={handleSubmit} className="stack section">
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error ? <div className="error-text">{error}</div> : null}

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div style={{ marginTop: 12 }}>
            <div className="muted">Or sign in with</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn" onClick={() => handleSocial('google')}>Google</button>
              <button className="btn" onClick={() => handleSocial('facebook')}>Facebook</button>
              <button className="btn" onClick={() => handleSocial('github')}>GitHub</button>
            </div>
            <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              Note: Social login requires provider configuration on the server. If you see a message that it's not configured, contact the site administrator.
            </div>
          </div>

          <div className="section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link className="subtle-link" href="/">
              ← Back to landing
            </Link>
            <Link className="subtle-link" href="/register">
              Create an account
            </Link>
            <Link className="subtle-link" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
