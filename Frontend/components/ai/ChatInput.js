"use client";

import { useState } from 'react';

export default function ChatInput({ onSend }) {
  const [value, setValue] = useState('');
  const send = (e) => {
    e.preventDefault();
    if (!value) return;
    if (onSend) onSend(value);
    setValue('');
  };
  return (
    <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
      <input className="input" placeholder="Ask a question..." value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="btn" type="submit">Send</button>
    </form>
  );
}
