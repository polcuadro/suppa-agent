// admin/src/App.jsx
// ───────────────────────────────────────────────────────
// Root admin component.
// Verifies the user has role: admin in authorizedUsers/.
// All real logic lives in AdminPanel.jsx.
// ───────────────────────────────────────────────────────
import { useAuth } from './hooks/useAuth';
import { AdminPanel } from './components/AdminPanel';
import { CodeTester } from './components/CodeTester';
import { VER } from './constants';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './services/firebase';

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    getDoc(doc(db, 'authorizedUsers', user.email)).then(snap => {
      setIsAdmin(snap.exists() && snap.data().role === 'admin');
    });
  }, [user]);

  if (loading || isAdmin === null) {
    return <div style={{ padding: 32, color: '#fff' }}>Loading…</div>;
  }

  if (!user) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#111', color: '#fff', gap: 16
    }}>
      <h1>suppa-agent · admin</h1>
      <button
        onClick={login}
        style={{
          padding: '14px 28px', fontSize: 16, background: '#fff', color: '#111',
          border: 'none', borderRadius: 8, cursor: 'pointer'
        }}>
        Login with Google
      </button>
      <small style={{ color: '#666' }}>{VER}</small>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ padding: 32, color: '#fff', background: '#1a0000', minHeight: '100vh' }}>
      <h2>⛔ Not authorized</h2>
      <p>{user.email} is not an admin.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );

  return (
    <>
      <AdminPanel user={user} logout={logout} />
      <CodeTester />
    </>
  );
}
