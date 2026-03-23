export default function ProjectList({ projects = [] }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {projects.length === 0 ? (
        <div className="muted">No projects yet.</div>
      ) : (
        projects.map((p, i) => (
          <div key={p._id || p.id || i}>
            <a href={`/projects/${p._id || p.id || i}`} className="card" style={{ display: 'block', padding: 12 }}>{p.name}</a>
          </div>
        ))
      )}
    </div>
  );
}
