// web/src/components/CodeTester.jsx
// ───────────────────────────────────────────────────────
// Floating bottom-right console showing logs the
// Cloud Functions write to 'testerLogs'. Real-time.
// Also a thermometer of architectural health.
// ───────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const SEVERITY_COLOR = { info: '#0f0', warn: '#fa0', error: '#f33' };

export function CodeTester() {
  const [logs, setLogs] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const q = query(
      collection(db, 'testerLogs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    return onSnapshot(
      q,
      (snap) => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error('CodeTester listener error:', err)
    );
  }, []);

  const visible = filter === 'all' ? logs : logs.filter(l => l.severity === filter);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      width: collapsed ? 180 : 520,
      height: collapsed ? 28 : 340,
      background: '#000',
      color: '#0f0',
      fontFamily: 'Menlo, Consolas, monospace',
      fontSize: 11,
      borderTop: '1px solid #0f0',
      borderLeft: '1px solid #0f0',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          padding: '4px 8px',
          borderBottom: collapsed ? 'none' : '1px solid #0f0',
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <span>{collapsed ? '▶' : '▼'} CODE TESTER · {visible.length} logs</span>
        {!collapsed && (
          <select
            value={filter}
            onChange={e => { e.stopPropagation(); setFilter(e.target.value); }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#000', color: '#0f0', border: '1px solid #0f0', fontSize: 10 }}
          >
            <option value="all">all</option>
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
          </select>
        )}
      </div>
      {!collapsed && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {visible.length === 0 && <div style={{ color: '#444' }}>// no logs</div>}
          {visible.map(log => {
            const t = log.timestamp?.toDate?.()?.toISOString().slice(11, 19) || '...';
            const c = SEVERITY_COLOR[log.severity] || '#0f0';
            return (
              <div key={log.id} style={{ color: c, marginBottom: 2, lineHeight: 1.4 }}>
                <span style={{ color: '#666' }}>[{t}]</span>{' '}
                <span style={{ color: '#888' }}>[{log.type}]</span>{' '}
                {log.message}
                {log.meta && Object.keys(log.meta).length > 0 && (
                  <span style={{ color: '#666', marginLeft: 6 }}>
                    {JSON.stringify(log.meta).slice(0, 120)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
