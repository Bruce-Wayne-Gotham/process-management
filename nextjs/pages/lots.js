import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Link from 'next/link';

export default function LotsPage() {
  const [lots, setLots] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        console.log('Loading lots...');
        const res = await fetch('/api/lots');
        console.log('Lots API response:', res.status);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const rows = await res.json();
        console.log('Lots data:', rows);
        if (mounted) {
          setLots(rows || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Lots loading error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; }
  }, []);

  const filtered = lots.filter(lot =>
    lot.lot_code?.toLowerCase().includes(search.toLowerCase()) ||
    lot.remarks?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading lots...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <Card title="❌ Error Loading Lots">
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
        <Button onClick={() => window.location.reload()}>
          🔄 Retry
        </Button>
      </Card>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            📦 Lots Management
          </h1>
          <Link href="/lots/add" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              ➕ Create New Lot
            </Button>
          </Link>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Manage tobacco processing lots and batch operations
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{lots.length}</div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Lots</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚖️</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {lots.reduce((sum, lot) => sum + (parseFloat(lot.total_input_weight) || 0), 0).toFixed(1)} kg
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Weight</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {lots.filter(lot => (parseFloat(lot.total_input_weight) || 0) > 0).length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Active Lots</div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card title="🔍 Search & Filter">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by lot code or remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
          />
          <Button variant="outline" onClick={() => setSearch('')}>
            Clear
          </Button>
        </div>
      </Card>

      {/* Lots Table */}
      <Card title={`📦 Lots (${filtered.length})`}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No lots found</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              {lots.length === 0 ? 'Create your first lot to get started' : 'Try adjusting your search criteria'}
            </p>
            <Link href="/lots/add" style={{ textDecoration: 'none' }}>
              <Button variant="primary">
                ➕ Create First Lot
              </Button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Lot Code
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Date
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Input Weight (kg)
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Status
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Remarks
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lot, index) => (
                  <tr key={lot.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '500', color: '#1e293b' }}>{lot.lot_code}</div>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      {new Date(lot.lot_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                      <span style={{ 
                        fontWeight: '500', 
                        color: (parseFloat(lot.total_input_weight) || 0) > 0 ? '#059669' : '#6b7280' 
                      }}>
                        {(parseFloat(lot.total_input_weight) || 0).toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: (parseFloat(lot.total_input_weight) || 0) > 0 ? '#dcfce7' : '#f3f4f6',
                        color: (parseFloat(lot.total_input_weight) || 0) > 0 ? '#166534' : '#6b7280'
                      }}>
                        {(parseFloat(lot.total_input_weight) || 0) > 0 ? 'Active' : 'Empty'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      {lot.remarks || '-'}
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <Button variant="outline" size="sm">
                        👁️ View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
}
