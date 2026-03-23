import Link from 'next/link';

export default function ProjectCard({ project }) {
  if (!project) return null;
  const id = project._id || project.id;
  return (
    <Link href={`/projects/${id}`} className="card" style={{ padding: 12, display: 'block', textDecoration: 'none' }}>
      <strong>{project.name}</strong>
      <div className="muted" style={{ marginTop: 6 }}>{project.description}</div>
    </Link>
  );
}
