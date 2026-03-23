"use client";

import { useState } from 'react';

export default function NoteForm({ onSave }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (onSave) await onSave({ title, content });
      setTitle('');
      setContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <textarea className="input" placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
      <div>
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Note'}</button>
      </div>
    </form>
  );
}
