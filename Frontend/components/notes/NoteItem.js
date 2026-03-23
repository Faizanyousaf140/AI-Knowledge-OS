export default function NoteItem({ note }) {
  if (!note) return null;
  return (
    <div className="card" style={{ padding: 12 }}>
      <strong>{note.title}</strong>
      <div className="muted" style={{ marginTop: 8 }}>{note.content}</div>
    </div>
  );
}
