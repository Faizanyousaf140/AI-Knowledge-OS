import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card hero-card">
          <h1 className="title hero-title">AI Knowledge OS</h1>
        <p className="muted">
          Minimal frontend starter: landing page, login, dashboard, and logout flow.
        </p>
        <div className="row section">
          <Link className="btn" href="/login">
            Login
          </Link>
          <Link className="btn secondary" href="/dashboard">
            Open Dashboard
          </Link>
          <Link className="btn" href="/register">
            Register
          </Link>
        </div>

          <div className="section">
            <span className="status-pill">
              <span className="status-dot" aria-hidden="true" />
              UI Ready for Integration
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
