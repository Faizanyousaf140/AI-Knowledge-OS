export default function ChatMessage({ msg }) {
  return (
    <div style={{ padding: 10 }}>
      <div style={{ fontWeight: 600 }}>{msg?.author || 'AI'}</div>
      <div className="muted" style={{ marginTop: 6 }}>{msg?.text}</div>
    </div>
  );
}
