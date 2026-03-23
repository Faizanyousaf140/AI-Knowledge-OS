"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listProjects } from "../../services/project.service";
import { listNotes } from "../../services/note.service";

export default function WorkspacePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [todayPriorities, setTodayPriorities] = useState([]);
  const [timeline, setTimeline] = useState([]);

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

  const recentProjects = useMemo(() => projects.slice(0, 4), [projects]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aiRecentQuestions");
      const parsed = JSON.parse(raw || "[]");
      const list = Array.isArray(parsed) ? parsed : [];
      setRecentQuestions(list.slice(0, 6));
    } catch (e) {
      setRecentQuestions([]);
    }
  }, []);

  useEffect(() => {
    const sorted = [...projects].sort((a, b) => {
      const aTs = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      const bTs = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
      return bTs - aTs;
    });

    const t = sorted.slice(0, 8).map((p) => ({
      id: p?._id || p?.id,
      name: p?.name || "Untitled",
      at: p?.updatedAt || p?.createdAt,
      kind: p?.updatedAt ? "Updated" : "Created",
    }));
    setTimeline(t);
  }, [projects]);

  useEffect(() => {
    if (!projects.length) {
      setTodayPriorities([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const candidates = projects.slice(0, 4);
      const extracted = [];

      for (const project of candidates) {
        const projectId = project?._id || project?.id;
        if (!projectId) continue;
        try {
          const nres = await listNotes(projectId);
          const notes = Array.isArray(nres) ? nres : (nres && nres.data ? nres.data : []);
          const latest = [...notes]
            .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
            .slice(0, 3);

          for (const note of latest) {
            const content = String(note?.content || "");
            const lines = content
              .split(/\n|\.|!/)
              .map((s) => s.trim())
              .filter(Boolean);
            const picked =
              lines.find((line) => /(todo|next|action|need|pending|follow|update|implement|fix|review)/i.test(line)) ||
              lines[0];

            if (picked) {
              extracted.push({
                projectName: project?.name || "Project",
                text: picked,
                createdAt: note?.createdAt || new Date().toISOString(),
              });
            }
          }
        } catch (e) {
          // ignore per-project note failures
        }
      }

      const dedup = [];
      const seen = new Set();
      for (const item of extracted) {
        const key = `${item.projectName}:${item.text}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          dedup.push(item);
        }
      }

      if (!cancelled) {
        setTodayPriorities(dedup.slice(0, 6));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projects]);

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card workspace-hero">
          <span className="workspace-kicker">Command Center</span>
          <h1 className="title workspace-title">Workspace</h1>
          <p className="muted workspace-subtitle" style={{ marginTop: 8 }}>
            Track your active projects, jump into meetings and mail threads, and keep settings in sync.
          </p>

          <div className="workspace-stats section">
            <div className="workspace-stat-card">
              <div className="workspace-stat-label">Projects</div>
              <div className="workspace-stat-value">{loading ? "..." : projects.length}</div>
            </div>
            <div className="workspace-stat-card">
              <div className="workspace-stat-label">Meetings Hub</div>
              <div className="workspace-stat-value">Ready</div>
            </div>
            <div className="workspace-stat-card">
              <div className="workspace-stat-label">Mail Channels</div>
              <div className="workspace-stat-value">{loading ? "..." : Math.min(projects.length, 6)}</div>
            </div>
          </div>

          <div className="workspace-actions section">
            <Link href="/projects" className="btn">Open Projects</Link>
            <Link href="/meetings" className="btn secondary">Open Meetings</Link>
            <Link href="/mail" className="btn secondary">Open Mail</Link>
            <Link href="/settings" className="btn secondary">Open Settings</Link>
          </div>

          <div className="section" style={{ marginTop: 16 }}>
            <h3 className="title" style={{ margin: 0 }}>Recent Projects</h3>
            {loading ? (
              <p className="muted" style={{ marginTop: 8 }}>Loading workspace data...</p>
            ) : recentProjects.length ? (
              <div className="workspace-grid" style={{ marginTop: 10 }}>
                {recentProjects.map((p, idx) => {
                  const id = p && (p._id || p.id) ? (p._id || p.id) : `proj-${idx}`;
                  return (
                    <Link key={id} href={`/projects/${id}`} className="workspace-project-card">
                      <strong>{p.name || "Untitled Project"}</strong>
                      <p className="muted" style={{ margin: "6px 0 0" }}>
                        {p.description || "No description yet. Add one to improve AI context quality."}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mini-card" style={{ marginTop: 10 }}>
                <p className="muted" style={{ margin: 0 }}>
                  No projects yet. Start by creating your first project to unlock meetings, mail channels, and AI context history.
                </p>
                <div style={{ marginTop: 10 }}>
                  <Link href="/projects" className="btn">Create First Project</Link>
                </div>
              </div>
            )}
          </div>

          <div className="section" style={{ marginTop: 16 }}>
            <h3 className="title" style={{ margin: 0 }}>Recent AI Questions</h3>
            {recentQuestions.length ? (
              <div className="workspace-grid" style={{ marginTop: 10 }}>
                {recentQuestions.map((q, idx) => (
                  <div key={`${q.projectId || 'p'}-${idx}`} className="workspace-project-card">
                    <strong>{q.projectName || "Project"}</strong>
                    <p className="muted" style={{ margin: "6px 0 0" }}>{q.question}</p>
                    <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                      {q.createdAt ? new Date(q.createdAt).toLocaleString() : "Just now"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 8 }}>
                Ask AI from any project to populate this panel.
              </p>
            )}
          </div>

          <div className="section" style={{ marginTop: 16 }}>
            <h3 className="title" style={{ margin: 0 }}>Today’s Priorities</h3>
            {todayPriorities.length ? (
              <div className="mini-card" style={{ marginTop: 10 }}>
                <ul className="list" style={{ marginTop: 0 }}>
                  {todayPriorities.map((p, idx) => (
                    <li key={`${p.projectName}-${idx}`}>
                      <strong>{p.projectName}:</strong> {p.text}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 8 }}>
                Add project notes with action items (todo, next, pending) to auto-generate priorities.
              </p>
            )}
          </div>

          <div className="section" style={{ marginTop: 16 }}>
            <h3 className="title" style={{ margin: 0 }}>Project Timeline</h3>
            {timeline.length ? (
              <div className="workspace-timeline" style={{ marginTop: 10 }}>
                {timeline.map((t, idx) => (
                  <div key={`${t.id || 't'}-${idx}`} className="workspace-timeline-item">
                    <div className="workspace-timeline-dot" aria-hidden="true" />
                    <div>
                      <strong>{t.name}</strong>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {t.kind} · {t.at ? new Date(t.at).toLocaleString() : "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 8 }}>
                Timeline appears as soon as projects are created or updated.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
