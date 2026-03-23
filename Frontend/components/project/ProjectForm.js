"use client";

import { useState } from 'react';

export default function ProjectForm({ onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (onCreate) await onCreate({ name, description });
      setName('');
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <input className="input" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="input" placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div>
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
      </div>
    </form>
  );
}
