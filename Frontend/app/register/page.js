"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser, startOAuth } from '../../services/auth.service';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerUser({ name: fullName, email, password, contact, organization });
      router.push("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
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
      alert((data && data.message) || `Social signup for ${provider} responded.`);
    } catch (err) {
      alert(`Could not contact server for ${provider} signup: ${err.message || err}`);
    }
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1 className="title" style={{ fontSize: "2rem" }}>
            Create account
          </h1>
          <p className="muted">Register a new account to start using your AI Knowledge OS.</p>


          <form onSubmit={handleSubmit} className="stack section">
            <input
              className="input"
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

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
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              className="input"
              type="tel"
              placeholder="Contact phone (optional)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />

            <input
              className="input"
              type="text"
              placeholder="Organization (optional)"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />

            {error ? <div className="error-text">{error}</div> : null}

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <div style={{ marginTop: 12 }}>
            <div className="muted">Or continue with</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn" onClick={() => handleSocial('google')}>Google</button>
              <button className="btn" onClick={() => handleSocial('facebook')}>Facebook</button>
              <button className="btn" onClick={() => handleSocial('github')}>GitHub</button>
            </div>
            <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              Social signup requires provider configuration on the server. If unavailable, use email registration.
            </div>
          </div>

          <div className="section" style={{ marginTop: 12 }}>
            <Link className="subtle-link" href="/login">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
