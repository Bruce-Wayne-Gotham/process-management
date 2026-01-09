'use client';
import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Link from 'next/link';

export default function JardiPage() {
  const [jardiOutputs, setJardiOutputs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        console.log('Loading jardi outputs...');
        const res = await fetch('/api/jardi');
        console.log('Jardi API response:', res.status);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const rows = await res.json();
        console.log('Jardi data:', rows);
        if (mounted) {
          setJardiOutputs(rows || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Jardi loading error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; }
  }, []);

  const filtered = jardiOutputs.filter(output =>
    output.process?.process_code?.toLowerCase().includes(search.toLowerCase()) ||
    output.process?.lots?.lot_code?.toLowerCase().includes(search.toLowerCase()) ||
    output.grade?.toLowerCase().includes(search.toLowerCase()) ||
    output.packaging_type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading jardi outputs...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <Card title="❌ Error Loading Jardi Outputs">
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
        <Button onClick={() => window.location.reload()}>
          🔄 Retry
        </Button>
      </Card>
    </Layout>
  );

  const totalJardiWeight = jardiOutputs.reduce((sum, output) => sum + (parseFloat(output.jardi_weight) || 0), 0);
  const totalPackages = jardiOutputs.reduce((sum, output) => sum + (parseInt(output.num_packages) || 0), 0);

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            🍂 Jardi Output Management
          </h1>
          <Link href="/jardi/add" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              ➕ Record Output
            </Button>
          </Link>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Track processed tobacco output and packaging details
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍂</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{jardiOutputs.length}</div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Outputs</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚖️</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
              {totalJardiWeight.toFixed(1)} kg
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Weight</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {totalPackages}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Packages</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {jardiOutputs.length > 0 ? (totalJardiWeight / jardiOutputs.length).toFixed(1) : '0'} kg
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Avg per Output</div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card title="🔍 Search & Filter">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by process, lot, grade, or packaging..."
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

      {/* Jardi Outputs Table */}
      <Card title={`🍂 Jardi Outputs (${filtered.length})`}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍂</div>
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No outputs found</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              {jardiOutputs.length === 0 ? 'Record your first output to get started' : 'Try adjusting your search criteria'}
            </p>
            <Link href="/jardi/add" style={{ textDecoration: 'none' }}>
              <Button variant="primary">
                ➕ Record First Output
              </Button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Process
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Lot
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Jardi Weight (kg)
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Grade
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Packages
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Packed Weight (kg)
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Packaging
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((output, index) => (
                  <tr key={output.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '500', color: '#1e293b' }}>
                        {output.process?.process_code || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {output.process?.process_date ? new Date(output.process.process_date).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      {output.process?.lots?.lot_code || '-'}
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                      <span style={{ fontWeight: '500', color: '#059669' }}>
                        {(parseFloat(output.jardi_weight) || 0).toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: output.grade ? '#dcfce7' : '#f3f4f6',
                        color: output.grade ? '#166534' : '#6b7280'
                      }}>
                        {output.grade || 'Ungraded'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontWeight: '500', color: '#1e293b' }}>
                        {output.num_packages || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                      <span style={{ color: '#64748b' }}>
                        {(parseFloat(output.total_packed_weight) || 0).toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      {output.packaging_type || '-'}
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
