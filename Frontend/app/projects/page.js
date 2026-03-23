"use client";

import { useEffect, useState } from 'react';
import ProjectList from '../../components/project/ProjectList';
import ProjectForm from '../../components/project/ProjectForm';
import { listProjects, createProject as createProjectSvc } from '../../services/project.service';

export default function ProjectsIndexPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await listProjects();
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        setProjects(list);
      } catch (err) {
        console.error('Failed to load projects', err.message || err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async (payload) => {
    const created = await createProjectSvc(payload);
    const newProj = created && created.data ? created.data : (created && created.project ? created.project : created);
    if (newProj) setProjects((s) => [newProj, ...s]);
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card">
          <h1 className="title">Projects</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Project index — create or open a project.
          </p>

          <div className="section mini-card" style={{ marginTop: 12 }}>
            <h3 className="title">Create Project</h3>
            <ProjectForm onCreate={handleCreate} />
          </div>

          <div className="section" style={{ marginTop: 12 }}>
            <h3 className="title">Your Projects</h3>
            {loading ? <div className="muted">Loading…</div> : <ProjectList projects={projects} />}
          </div>
        </div>
      </div>
    </main>
  );
}
