'use client';
import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Link from 'next/link';

export default function FarmersPage() {
  const [farmers, setFarmers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        console.log('Loading farmers...');
        const res = await fetch('/api/farmers');
        console.log('Farmers API response:', res.status);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const rows = await res.json();
        console.log('Farmers data:', rows);
        if (mounted) {
          setFarmers(rows || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Farmers loading error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
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

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading farmers...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <Card 
        title="Farmers Management"
        actions={
          <Link href="/farmers/add" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              <span>➕</span>
              Add Farmer
            </Button>
          </Link>
        }
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="🔍 Search by name, code, village, or contact..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              backgroundColor: '#f9fafb'
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            color: '#dc2626',
            marginBottom: '1.5rem'
          }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: '0.5rem', color: '#b91c1c', fontSize: '0.95rem' }}>
              Ensure AWS RDS database is configured and DATABASE_URL environment variable is set correctly.
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Code</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Village</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Contact</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Efficacy</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem', fontWeight: '500', color: '#1f2937' }}>
                    {f.farmer_code}
                  </td>
                  <td style={{ padding: '1rem', color: '#1f2937' }}>
                    {f.name}
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>
                    {f.village || '-'}
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>
                    {f.contact_number || '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {f.efficacy_score ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        backgroundColor: f.efficacy_score >= 8 ? '#dcfce7' : f.efficacy_score >= 6 ? '#fef3c7' : '#fee2e2',
                        color: f.efficacy_score >= 8 ? '#166534' : f.efficacy_score >= 6 ? '#92400e' : '#991b1b'
                      }}>
                        {f.efficacy_score}/10
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Not rated</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="outline" size="sm">
                        👁️ View
                      </Button>
                      <Button variant="secondary" size="sm">
                        ✏️ Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filtered.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🌾</div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No farmers found</p>
              <p style={{ fontSize: '0.9rem' }}>
                {search ? 'Try adjusting your search terms' : 'Get started by adding your first farmer'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </Layout>
  );
}

