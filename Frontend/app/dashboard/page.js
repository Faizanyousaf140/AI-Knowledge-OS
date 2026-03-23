"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listProjects, createProject as createProjectSvc } from "../../services/project.service";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projError, setProjError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    setEmail(localStorage.getItem("userEmail") || "Logged in user");
    // load projects via service
    (async () => {
      try {
        const res = await listProjects();
        // API returns either array or { data: [...] }
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        setProjects(list);
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (msg === 'Invalid token') {
          router.replace('/login');
          return;
        }
        console.error("Failed to load projects", msg);
      }
    })();
  }, [router]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
    router.push("/");
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h1 className="title" style={{ fontSize: "2rem" }}>
              Dashboard
            </h1>
            <button className="btn secondary" onClick={logout}>
              Logout
            </button>
          </div>

          <p className="muted" style={{ marginTop: 12 }}>
            Welcome, {email}
          </p>

          <div className="mini-card">
            <h3 className="title" style={{ fontSize: "1.15rem" }}>
              AI Knowledge OS — Project Workspace
            </h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Production ready features available in this workspace:
            </p>
            <ul className="list">
              <li>Public landing page and onboarding</li>
              <li>Secure authentication and protected dashboard</li>
              <li>Project workspaces with notes and versioned metadata</li>
              <li>Searchable notes with AI-assisted retrieval (local fallback)</li>
            </ul>
          </div>

          <div className="section mini-card">
            <h3 className="title" style={{ margin: 0 }}>Projects</h3>
            <p className="muted" style={{ marginTop: 8 }}>Create and manage your projects.</p>

            <div style={{ marginTop: 12 }}>
              {projects.length === 0 ? (
                <div className="muted">No projects yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                  {projects.map((p, idx) => (
                    <Link
                      key={p && (p._id || p.id) ? (p._id || p.id) : `proj-${idx}`}
                      href={`/projects/${p && (p._id || p.id) ? (p._id || p.id) : `proj-${idx}`}`}
                      className="card"
                      style={{ padding: 12, display: 'block', textDecoration: 'none' }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <strong>{p.name}</strong>
                          <div className="muted" style={{ marginTop: 6 }}>{p.description}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProjError("");
                if (!projectName) return setProjError("Project name required");
                setCreating(true);
                try {
                  const created = await createProjectSvc({ name: projectName, description: projectDesc });
                    // API responds with { success: true, data: project } or the project directly
                    const newProj = created && created.data ? created.data : (created && created.project ? created.project : created);
                  if (newProj) setProjects((s) => [newProj, ...s]);
                  setProjectName("");
                  setProjectDesc("");
                } catch (err) {
                  setProjError(err.message || "Failed to create project");
                } finally {
                  setCreating(false);
                }
              }}
              style={{ marginTop: 12, display: "grid", gap: 10 }}
            >
              <input className="input" placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} required />
              <input className="input" placeholder="Short description (optional)" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} />
              {projError ? <div className="error-text">{projError}</div> : null}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>

          <div className="section">
            <span className="status-pill">
              <span className="status-dot" aria-hidden="true" />
              Session Active
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
