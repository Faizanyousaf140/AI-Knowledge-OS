"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProjects } from "../../services/project.service";

export default function MailPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await listProjects();
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        setProjects(list);
      } catch (e) {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const channels = projects.slice(0, 6);

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card">
          <h1 className="title">Mail</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Team and project mail inbox with project-linked conversations.
          </p>

          <div className="section mini-card" style={{ marginTop: 12 }}>
            <h3 className="title" style={{ margin: 0 }}>Inbox Overview</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              {loading
                ? "Loading project channels..."
                : channels.length
                  ? `${channels.length} project channel${channels.length > 1 ? "s" : ""} available for updates and follow-ups.`
                  : "No project channels yet. Create a project to start team mail threads."}
            </p>
          </div>

          {!loading && channels.length > 0 ? (
            <div className="section" style={{ marginTop: 12 }}>
              <h3 className="title" style={{ margin: 0 }}>Project Mail Channels</h3>
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                {channels.map((p, idx) => {
                  const id = p && (p._id || p.id) ? (p._id || p.id) : `proj-${idx}`;
                  return (
                    <Link key={id} href={`/projects/${id}`} className="card" style={{ padding: 12, display: "block", textDecoration: "none" }}>
                      <strong>{p.name || "Untitled Project"}</strong>
                      <div className="muted" style={{ marginTop: 6 }}>
                        {p.description || "Keep email summaries and key decisions tied to this project."}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
