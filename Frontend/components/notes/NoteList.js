import NoteItem from './NoteItem';

export default function NoteList({ notes = [] }) {
  if (!notes || notes.length === 0) return <div className="muted">No notes yet.</div>;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {notes.map((n) => (
        <NoteItem key={n._id || n.id} note={n} />
      ))}
    </div>
  );
}
