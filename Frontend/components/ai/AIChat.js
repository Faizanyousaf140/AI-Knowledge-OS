"use client";

import { useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function AIChat({ onAsk }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const send = async (text) => {
    setLoading(true);
    try {
      const userMsg = { author: 'You', text };
      setMessages((m) => [...m, userMsg]);
      let res;
      if (onAsk) res = await onAsk(text);
      else res = { answer: 'This is a local placeholder reply.' };
      setMessages((m) => [...m, { author: 'AI', text: res.answer || res }]);
    } catch (err) {
      setMessages((m) => [...m, { author: 'AI', text: 'Error: ' + (err.message || err) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'grid', gap: 8, marginBottom: 8 }}>
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
      </div>
      <ChatInput onSend={send} />
      {loading ? <div className="muted" style={{ marginTop: 8 }}>Thinking...</div> : null}
    </div>
  );
}
