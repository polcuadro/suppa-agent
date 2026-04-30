// web/src/App.jsx
// ───────────────────────────────────────────────────────
// Root component. Routes between auth states and composes
// other components. All real logic lives elsewhere.
// ───────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './services/firebase';
import { useAuth } from './hooks/useAuth';
import { Chat } from './components/Chat';
import { CodeTester } from './components/CodeTester';
import { VER, APP_NAME, APP_TAGLINE } from './constants';

export default function App() {
  const { user, loading, authorized, login, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    if (!user || !authorized) { setChats([]); return; }
    const q = query(
      collection(db, 'chats'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user, authorized]);

  if (loading) return <div style={{ padding: 32, color: '#fff' }}>Loading…</div>;

  if (!user) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#111', color: '#fff', gap: 16
    }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>{APP_NAME}</h1>
      <p style={{ color: '#888', fontSize: 14 }}>{APP_TAGLINE}</p>
      <button
        onClick={login}
        style={{
          padding: '14px 28px', background: '#fff', color: '#111',
          border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', marginTop: 8
        }}>
        Login with Google
      </button>
      <small style={{ color: '#444', marginTop: 8 }}>{VER}</small>
    </div>
  );

  if (!authorized) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#1a0000', color: '#fff', gap: 16, padding: 32, textAlign: 'center'
    }}>
      <h2>⛔ Access not authorized</h2>
      <p>Email <strong>{user.email}</strong> is not on the authorized users list.</p>
      <p style={{ color: '#888' }}>If you think you should be, ask the app owner.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );

  const newChat = async () => {
    const ref = await addDoc(collection(db, 'chats'), {
      ownerId: user.uid,
      title: 'New chat',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0
    });
    setActiveChatId(ref.id);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <aside style={{
        width: 240, borderRight: '1px solid #333', padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
        <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
        <button
          onClick={newChat}
          style={{
            padding: 8, background: '#222', color: '#fff',
            border: '1px solid #333', borderRadius: 4
          }}>
          + New chat
        </button>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chats.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveChatId(c.id)}
              style={{
                padding: 8, cursor: 'pointer', borderRadius: 4,
                background: c.id === activeChatId ? '#0066cc' : 'transparent',
                marginBottom: 2, fontSize: 13
              }}>
              {c.title}
            </div>
          ))}
        </div>
        <button
          onClick={logout}
          style={{
            padding: 6, fontSize: 12, background: 'transparent',
            color: '#888', border: '1px solid #333', borderRadius: 4
          }}>
          Logout
        </button>
        <small style={{ color: '#444', textAlign: 'center' }}>{VER}</small>
      </aside>
      <main style={{ flex: 1 }}>
        {activeChatId
          ? <Chat user={user} chatId={activeChatId} />
          : <div style={{ padding: 32, color: '#666' }}>Select or create a chat</div>}
      </main>
      <CodeTester />
    </div>
  );
}
