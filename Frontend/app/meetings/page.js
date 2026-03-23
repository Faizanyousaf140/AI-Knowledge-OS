"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProjects } from "../../services/project.service";

export default function MeetingsPage() {
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

  const recent = projects.slice(0, 5);

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card">
          <h1 className="title">Meetings</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Meetings, notes, and recordings are organized by project so discussions stay tied to delivery work.
          </p>

          <div className="section mini-card" style={{ marginTop: 12 }}>
            <h3 className="title" style={{ margin: 0 }}>Meeting Hub</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              {loading
                ? "Loading your project workspace..."
                : projects.length
                  ? `${projects.length} project${projects.length > 1 ? "s" : ""} available for meeting notes and recordings.`
                  : "Create your first project to start storing meeting notes and recordings."}
            </p>
          </div>

          <div className="section" style={{ marginTop: 12 }}>
            <h3 className="title" style={{ margin: 0 }}>Suggested Next Steps</h3>
            <ul className="list" style={{ marginTop: 8 }}>
              <li>Schedule weekly sync per active project.</li>
              <li>Capture action items directly in project notes after each meeting.</li>
              <li>Attach recording links and decisions for fast AI retrieval later.</li>
            </ul>
          </div>

          {!loading && recent.length > 0 ? (
            <div className="section" style={{ marginTop: 12 }}>
              <h3 className="title" style={{ margin: 0 }}>Projects Ready for Meetings</h3>
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                {recent.map((p, idx) => {
                  const id = p && (p._id || p.id) ? (p._id || p.id) : `proj-${idx}`;
                  return (
                    <Link key={id} href={`/projects/${id}`} className="card" style={{ padding: 12, display: "block", textDecoration: "none" }}>
                      <strong>{p.name || "Untitled Project"}</strong>
                      <div className="muted" style={{ marginTop: 6 }}>
                        {p.description || "No description yet. Add one to improve meeting context."}
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
