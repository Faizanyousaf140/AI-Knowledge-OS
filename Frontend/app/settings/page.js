"use client";

import { useEffect, useState } from "react";
import { getMe, startOAuth, unlinkProvider } from "../../services/auth.service";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const res = await getMe();
      setProfile(res.data || null);
    } catch (e) {
      setMessage(e.message || "Could not load profile");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const linkProvider = async (provider) => {
    try {
      const res = await startOAuth(provider, { link: true });
      if (res && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (e) {
      setMessage(e.message || `Could not link ${provider}`);
    }
  };

  const onUnlink = async (provider) => {
    try {
      await unlinkProvider(provider);
      setMessage(`${provider} unlinked.`);
      await load();
    } catch (e) {
      setMessage(e.message || `Could not unlink ${provider}`);
    }
  };

  const isLinked = (provider) => {
    return Boolean(profile && profile.oauthProviders && profile.oauthProviders[provider] && profile.oauthProviders[provider].id);
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card">
          <h1 className="title">Settings</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Manage profile, preferences, and linked social accounts.
          </p>

          {profile ? (
            <div className="section mini-card" style={{ marginTop: 12 }}>
              <h3 className="title" style={{ margin: 0 }}>Account Summary</h3>
              <p className="muted" style={{ marginTop: 8 }}>
                Signed in as <strong>{profile.name || "User"}</strong> ({profile.email || "no email"})
              </p>
              <p className="muted" style={{ marginTop: 6 }}>
                Role: <strong>{profile.role || "user"}</strong> · Email verified: <strong>{profile.emailVerified ? "Yes" : "No"}</strong>
              </p>
            </div>
          ) : null}

          {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}

          <div className="section">
            <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Connected Accounts</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => (isLinked("github") ? onUnlink("github") : linkProvider("github"))}>
                {isLinked("github") ? "Unlink GitHub" : "Link GitHub"}
              </button>
              <button className="btn" onClick={() => (isLinked("facebook") ? onUnlink("facebook") : linkProvider("facebook"))}>
                {isLinked("facebook") ? "Unlink Facebook" : "Link Facebook"}
              </button>
              <button className="btn" onClick={() => (isLinked("google") ? onUnlink("google") : linkProvider("google"))}>
                {isLinked("google") ? "Unlink Google" : "Link Google"}
              </button>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              Tip: Keep at least one social account linked so account recovery is easier.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
