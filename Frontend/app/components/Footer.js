"use client";

import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer style={{ marginTop: 36, padding: '18px 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="muted">© {year || ""} AI Knowledge OS</div>
        <div className="muted">Built with ❤️</div>
      </div>
    </footer>
  );
}
