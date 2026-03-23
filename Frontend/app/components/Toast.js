"use client";

import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2, 9);
    const t = { id, message, type: opts.type || "info" };
    setToasts((s) => [t, ...s]);
    if (!opts.persistent) {
      setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), opts.duration || 4000);
    }
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((s) => s.filter((t) => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 9999, display: "grid", gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ minWidth: 220, background: "rgba(10,14,30,0.96)", color: "#e9ecf5", padding: '10px 14px', borderRadius: 10, boxShadow: '0 8px 30px rgba(2,6,18,0.6)', border: '1px solid rgba(80,96,150,0.12)' }}>
            <div style={{ fontWeight: 600 }}>{t.type === 'error' ? 'Error' : t.type === 'success' ? 'Success' : 'Notice'}</div>
            <div style={{ marginTop: 6 }}>{t.message}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => remove(t.id)} style={{ background: 'transparent', border: 'none', color: '#9fb0ff', cursor: 'pointer' }}>Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.add;
}

export function useDismissToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useDismissToast must be used inside ToastProvider');
  return ctx.remove;
}
