'use client';
import React from 'react';

export default function FarmersPage() {
  const [farmers, setFarmers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/farmers');
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const rows = await res.json();
        if (mounted) setFarmers(rows || []);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message);
      }
      setLoading(false);
    }
    load();
    return () => { mounted = false; }
  }, []);

  const filtered = farmers.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.farmer_code?.toLowerCase().includes(search.toLowerCase()) ||
    f.village?.toLowerCase().includes(search.toLowerCase()) ||
    f.contact_number?.includes(search)
  );

  if (loading) return <p style={{ padding: '1rem' }}>Loading...</p>;

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Farmers</h1>
        <a href="/farmers/add" style={{ textDecoration: 'none', backgroundColor: '#0070f3', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px' }}>Add Farmer</a>
      </div>

      <input
        type="text"
        placeholder="Search by name, code, village, or contact..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
      />

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Code</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Village</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Contact</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>{f.farmer_code}</td>
                <td style={{ padding: '0.75rem' }}>{f.name}</td>
                <td style={{ padding: '0.75rem' }}>{f.village}</td>
                <td style={{ padding: '0.75rem' }}>{f.contact_number}</td>
                <td style={{ padding: '0.75rem' }}>{new Date(f.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !error && (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>No farmers found.</p>
        )}
      </div>
    </main>
  );
}

