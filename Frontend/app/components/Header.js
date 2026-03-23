"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [email, setEmail] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    try {
      const e = localStorage.getItem('userEmail');
      if (e) setEmail(e);
      const token = localStorage.getItem('accessToken');
      setIsAuthed(Boolean(token || e));
    } catch (e) {
      // ignore
    }
  }, []);

  const handleLogout = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userEmail");
      setEmail(null);
      setIsAuthed(false);
      router.push("/login");
    }
  };

  return (
    <header className="site-header">
      <div className="container header-row">
        <div className="header-brand">
          <Link href="/" className="brand-link">AI Knowledge OS</Link>
        </div>

        <nav className="site-nav">
          <Link className="subtle-link nav-item" href="/dashboard">Dashboard</Link>
          <Link className="subtle-link nav-item" href="/register">Register</Link>
          {isAuthed ? (
            <>
              {email ? <span className="muted user-email" title={email}>{email}</span> : null}
              <button className="subtle-link nav-item" onClick={handleLogout} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                Logout
              </button>
            </>
          ) : (
            <Link className="subtle-link nav-item" href="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
