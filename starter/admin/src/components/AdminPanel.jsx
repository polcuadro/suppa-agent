// admin/src/components/AdminPanel.jsx
// ───────────────────────────────────────────────────────
// Authorized users management.
// Only renders when the current user has role: admin in
// authorizedUsers/. Gating happens in admin/App.jsx.
// ───────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import {
  collection, doc, query, orderBy, onSnapshot,
  setDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';

export function AdminPanel({ user, logout }) {
  const [authorizedList, setAuthorizedList] = useState([]);
  const [users, setUsers] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('user');

  useEffect(() => {
    const unsubA = onSnapshot(collection(db, 'authorizedUsers'), (snap) => {
      setAuthorizedList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const qU = query(collection(db, 'users'), orderBy('lastSeen', 'desc'));
    const unsubU = onSnapshot(qU, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubA(); unsubU(); };
  }, []);

  const addUser = async () => {
    if (!newEmail.trim()) return;
    await setDoc(doc(db, 'authorizedUsers', newEmail.trim().toLowerCase()), {
      role: newRole,
      addedAt: serverTimestamp(),
      addedBy: user.email
    });
    setNewEmail('');
    setNewRole('user');
  };

  const removeUser = async (email) => {
    if (email === user.email) {
      alert('Cannot remove your own access');
      return;
    }
    if (confirm(`Remove access for ${email}?`)) {
      await deleteDoc(doc(db, 'authorizedUsers', email));
    }
  };

  const toggleAdmin = async (email, currentRole) => {
    const next = currentRole === 'admin' ? 'user' : 'admin';
    if (email === user.email && next === 'user') {
      alert('Cannot remove your own admin privileges');
      return;
    }
    await setDoc(doc(db, 'authorizedUsers', email), {
      role: next,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  return (
    <div style={{ padding: 24, color: '#fff', background: '#0a0a0a', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <h1>Admin Panel</h1>
        <div style={{ fontSize: 13 }}>
          {user.email} · <button onClick={logout}>Logout</button>
        </div>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2>Authorized users ({authorizedList.length})</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, marginTop: 12 }}>
          <input
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="email@gmail.com"
            style={{ flex: 1, padding: 8, background: '#222', color: '#fff', border: '1px solid #444' }}
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            style={{ padding: 8, background: '#222', color: '#fff', border: '1px solid #444' }}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button onClick={addUser}>Add</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444' }}>
              <th align="left" style={{ padding: 8 }}>Email</th>
              <th align="left" style={{ padding: 8 }}>Role</th>
              <th align="left" style={{ padding: 8 }}>Added by</th>
              <th align="right" style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {authorizedList.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: 8 }}>{a.id}</td>
                <td style={{ padding: 8 }}>
                  <span style={{ color: a.role === 'admin' ? '#fa0' : '#0f0', fontWeight: 'bold' }}>
                    {a.role || 'user'}
                  </span>
                </td>
                <td style={{ padding: 8, fontSize: 12, color: '#888' }}>{a.addedBy || '-'}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>
                  <button onClick={() => toggleAdmin(a.id, a.role)} style={{ marginRight: 8 }}>
                    {a.role === 'admin' ? '↓ user' : '↑ admin'}
                  </button>
                  <button onClick={() => removeUser(a.id)} style={{ background: '#600', color: '#fff', border: 'none', padding: '4px 8px' }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>User activity ({users.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444' }}>
              <th align="left" style={{ padding: 8 }}>Email</th>
              <th align="left" style={{ padding: 8 }}>Name</th>
              <th align="left" style={{ padding: 8 }}>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: 8 }}>{u.email}</td>
                <td style={{ padding: 8 }}>{u.displayName}</td>
                <td style={{ padding: 8, fontSize: 12, color: '#888' }}>
                  {u.lastSeen?.toDate?.()?.toLocaleString() || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
