"use client";

import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside style={{ width: 220, padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Workspace</div>
      </div>

      <nav style={{ display: 'grid', gap: 8 }}>
        <Link href="/dashboard" className="subtle-link">Dashboard</Link>
        <Link href="/projects" className="subtle-link">Projects</Link>
        <Link href="/meetings" className="subtle-link">Meetings</Link>
        <Link href="/mail" className="subtle-link">Mail</Link>
        <Link href="/settings" className="subtle-link">Settings</Link>
        <Link href="/admin" className="subtle-link">Admin</Link>
      </nav>
    </aside>
  );
}
