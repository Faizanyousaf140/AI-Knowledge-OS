"use client";

import { useEffect, useState } from "react";
import { getAllProjectsAdmin, regenerateProjectEmbeddings, getUsersAdmin, updateUserRole, deleteUserAdmin, getUsageByUser } from '../../services/admin.service';
import Link from "next/link";

export default function AdminPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserUsage, setSelectedUserUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const pres = await getAllProjectsAdmin();
        const plist = pres && pres.data ? pres.data : (pres || []);
        setProjects(plist);

        const ures = await getUsersAdmin();
        const ulist = ures && ures.data ? ures.data : (ures || []);
        setUsers(ulist);
      } catch (e) {
        setError(e.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePromote = async (userId) => {
    try {
      await updateUserRole(userId, 'admin');
      setUsers((s) => s.map(u => (u._id === userId ? { ...u, role: 'admin' } : u)));
      alert('User promoted to admin');
    } catch (e) { alert(e.message || 'Failed'); }
  };

  const handleDemote = async (userId) => {
    try {
      await updateUserRole(userId, 'user');
      setUsers((s) => s.map(u => (u._id === userId ? { ...u, role: 'user' } : u)));
      alert('User demoted to user');
    } catch (e) { alert(e.message || 'Failed'); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete user? This cannot be undone.')) return;
    try {
      await deleteUserAdmin(userId);
      setUsers((s) => s.filter(u => u._id !== userId));
      alert('User deleted');
    } catch (e) { alert(e.message || 'Failed'); }
  };

  const handleShowUsage = async (userId) => {
    try {
      const res = await getUsageByUser(userId, 30);
      const data = res && res.data ? res.data : [];
      setSelectedUserUsage({ userId, data });
    } catch (e) { alert(e.message || 'Failed'); }
  };

  const handleRegenerate = async (projectId) => {
    setBusyId(projectId);
    try {
      await regenerateProjectEmbeddings(projectId);
      alert('Regeneration started for project ' + projectId);
    } catch (e) {
      alert(e.message || 'Failed to start regeneration');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card">
          <h1 className="title">Admin</h1>
          <p className="muted">Project administration (admin only)</p>

          {loading ? <div>Loading...</div> : null}
          {error ? <div className="error-text">{error}</div> : null}

          {!loading && !error ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <div className="card">
                <h3 className="title">Users</h3>
                {users.length === 0 ? <div className="muted">No users found.</div> : (
                  users.map(u => (
                    <div key={u._id || u.id} style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name} <span className="muted">({u.role})</span></div>
                          <div className="muted" style={{ marginTop: 4 }}>{u.email}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn" onClick={() => navigator.clipboard.writeText(u._id || u.id)}>Copy ID</button>
                          {u.role !== 'admin' ? <button className="btn" onClick={() => handlePromote(u._id || u.id)}>Promote</button> : <button className="btn" onClick={() => handleDemote(u._id || u.id)}>Demote</button>}
                          <button className="btn secondary" onClick={() => handleDeleteUser(u._id || u.id)}>Delete</button>
                          <button className="btn" onClick={() => handleShowUsage(u._id || u.id)}>Usage</button>
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <strong className="muted">Projects:</strong>
                        <div style={{ marginTop: 6 }}>
                          {projects.filter(p => (p.owner === (u._id || u.id))).length === 0 ? <div className="muted">No projects</div> : (
                            projects.filter(p => (p.owner === (u._id || u.id))).map(p2 => (
                              <div key={p2._id || p2.id} style={{ marginTop: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{p2.name}</div>
                                    <div className="muted">{p2.description}</div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <Link href={`/projects/${p2._id || p2.id}`} className="btn">Open</Link>
                                    <button className="btn" onClick={() => handleRegenerate(p2._id || p2.id)} disabled={busyId === (p2._id || p2.id)}>{busyId === (p2._id || p2.id) ? 'Working...' : 'Regenerate'}</button>
                                  </div>
                                </div>
                                {selectedUserUsage ? (
                                  <div style={{ marginTop: 12 }} className="card">
                                    <h3 className="title">Usage (last 30 days)</h3>
                                    {selectedUserUsage.data.length === 0 ? <div className="muted">No usage data</div> : (
                                      <div style={{ display: 'grid', gap: 6 }}>
                                        {selectedUserUsage.data.map(d => (
                                          <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div className="muted">{d.dateKey}</div>
                                            <div>{d.aiRequestsCount} requests · {d.embeddingsCreated} embeddings · {d.totalTokens} tokens</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
