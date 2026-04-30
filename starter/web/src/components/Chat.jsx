// web/src/components/Chat.jsx
// ───────────────────────────────────────────────────────
// Single-responsibility chat component.
// Reads messages in real-time from Firestore, sends new
// messages via the chatWithGemini Cloud Function.
// ───────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../services/firebase';

export function Chat({ user, chatId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!chatId) { setMessages([]); return; }
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
  }, [chatId]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setLoading(true);
    try {
      const fn = httpsCallable(functions, 'chatWithGemini');
      await fn({ chatId, userMessage: msg });
    } catch (err) {
      alert('Error: ' + err.message);
      setInput(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#111' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {messages.length === 0 && (
          <div style={{ color: '#666', textAlign: 'center', marginTop: 80 }}>
            Start the conversation
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{
            margin: '8px 0',
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: m.role === 'user' ? '#0066cc' : '#2a2a2a',
              color: '#fff',
              maxWidth: '70%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: '#888', fontStyle: 'italic', padding: 8 }}>
            Gemini is typing…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #333', display: 'flex', gap: 8, background: '#1a1a1a' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: 10, background: '#222', color: '#fff',
            border: '1px solid #444', borderRadius: 8
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px', background: '#0066cc', color: '#fff',
            border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer'
          }}>
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
