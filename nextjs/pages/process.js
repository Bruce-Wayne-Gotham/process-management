import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Link from 'next/link';

export default function ProcessPage() {
  const [processes, setProcesses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        console.log('Loading processes...');
        const res = await fetch('/api/process');
        console.log('Process API response:', res.status);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const rows = await res.json();
        console.log('Process data:', rows);
        if (mounted) {
          setProcesses(rows || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Process loading error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; }
  }, []);

  const filtered = processes.filter(process =>
    process.process_code?.toLowerCase().includes(search.toLowerCase()) ||
    process.lots?.lot_code?.toLowerCase().includes(search.toLowerCase()) ||
    process.process_status?.label?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading processes...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <Card title="❌ Error Loading Processes">
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
            ⚙️ Process Management
          </h1>
          <Link href="/process/add" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              ➕ Start New Process
            </Button>
          </Link>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Monitor and manage tobacco processing operations
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{processes.length}</div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Processes</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {processes.filter(p => p.process_status?.status_code === 'IN_PROGRESS').length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>In Progress</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {processes.filter(p => p.process_status?.status_code === 'COMPLETED').length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Completed</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚖️</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {processes.reduce((sum, p) => sum + (parseFloat(p.input_weight) || 0), 0).toFixed(1)} kg
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Input</div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card title="🔍 Search & Filter">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by process code, lot, or status..."
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

      {/* Process Table */}
      <Card title={`⚙️ Processes (${filtered.length})`}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No processes found</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              {processes.length === 0 ? 'Start your first process to get started' : 'Try adjusting your search criteria'}
            </p>
            <Link href="/process/add" style={{ textDecoration: 'none' }}>
              <Button variant="primary">
                ➕ Start First Process
              </Button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Process Code
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Lot
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Date
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Input (kg)
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Wastage (kg)
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Status
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((process, index) => (
                  <tr key={process.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '500', color: '#1e293b' }}>{process.process_code}</div>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      {process.lots?.lot_code || '-'}
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      {new Date(process.process_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                      <span style={{ fontWeight: '500', color: '#059669' }}>
                        {(parseFloat(process.input_weight) || 0).toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                      <span style={{ color: '#dc2626' }}>
                        {(parseFloat(process.total_wastage_weight) || 0).toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: process.process_status?.status_code === 'COMPLETED' ? '#dcfce7' : 
                                       process.process_status?.status_code === 'IN_PROGRESS' ? '#fef3c7' : '#f3f4f6',
                        color: process.process_status?.status_code === 'COMPLETED' ? '#166534' : 
                               process.process_status?.status_code === 'IN_PROGRESS' ? '#92400e' : '#6b7280'
                      }}>
                        {process.process_status?.label || 'Pending'}
                      </span>
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
