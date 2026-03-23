"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMe } from '../../services/auth.service';

export default function SidebarNew() {
  const path = usePathname() || '/';
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setIsAdmin(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const me = await getMe();
        const role = me && me.data ? me.data.role : null;
        if (mounted) setIsAdmin(role === 'admin');
      } catch (e) {
        if (mounted) setIsAdmin(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const baseItems = [
    { href: '/workspace', label: 'Workspace' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/projects', label: 'Projects' },
    { href: '/meetings', label: 'Meetings' },
    { href: '/mail', label: 'Mail' },
    { href: '/settings', label: 'Settings' },
  ];

  const items = isAdmin ? [...baseItems, { href: '/admin', label: 'Admin' }] : baseItems;

  return (
    <aside className="sidebar card" style={{ padding: 12 }}>
      <div className="sidebar-title">Navigation</div>

      <nav className="nav">
        {items.map((it) => {
          const active = path === it.href || (it.href !== '/' && path?.startsWith(it.href));
          return (
            <Link key={it.href} href={it.href} className={`sidebar-item ${active ? 'active' : ''}`}>
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
