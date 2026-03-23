"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from '../../services/auth.service';

export default function Onboarding() {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const options = [
    { id: 'work', title: 'For work', desc: 'Track projects, company goals, meeting notes' },
    { id: 'personal', title: 'For personal life', desc: 'Write better, think more clearly, stay organized' },
    { id: 'school', title: 'For school', desc: 'Keep notes, research, and tasks in one place' },
  ];

  const toggle = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
  };

  const save = async () => {
    setLoading(true);
    try {
      await updateProfile({ interests: selected });
    } catch (e) {
      // ignore — best-effort
    } finally {
      setLoading(false);
      router.push('/dashboard');
    }
  };

  return (
    <main className="page-wrap">
      <div className="container">
        <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 className="title">How do you want to use the app?</h1>
          <p className="muted">Choose a few options to personalize your workspace.</p>

          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {options.map(o => (
              <div key={o.id} className="mini-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{o.title}</div>
                  <div className="muted" style={{ marginTop: 6 }}>{o.desc}</div>
                </div>
                <div>
                  <button className={`btn ${selected.includes(o.id) ? '' : 'secondary'}`} onClick={() => toggle(o.id)}>{selected.includes(o.id) ? 'Selected' : 'Select'}</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn" onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Continue'}</button>
            <button className="btn secondary" onClick={() => router.push('/dashboard')}>Skip</button>
          </div>
        </div>
      </div>
    </main>
  );
}
