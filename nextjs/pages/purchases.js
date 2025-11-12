'use client';
import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Link from 'next/link';

export default function PurchasesPage() {
  const [purchases, setPurchases] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/purchases');
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const rows = await res.json();
        if (mounted) setPurchases(rows || []);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message);
      }
      setLoading(false);
    }
    load();
    return () => { mounted = false; }
  }, []);

  const filtered = purchases.filter(p =>
    p.farmers?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.farmers?.farmer_code?.toLowerCase().includes(search.toLowerCase()) ||
    p.farmers?.village?.toLowerCase().includes(search.toLowerCase()) ||
    p.packaging_type?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPurchases = filtered.length;
  const totalAmount = filtered.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const totalWeight = filtered.reduce((sum, p) => sum + (p.total_weight || 0), 0);

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading purchases...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#3b82f6', marginBottom: '0.5rem' }}>🧾</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{totalPurchases}</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Purchases</div>
            </div>
          </Card>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#10b981', marginBottom: '0.5rem' }}>⚖️</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{totalWeight.toFixed(2)} kg</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Weight</div>
            </div>
          </Card>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: '0.5rem' }}>💰</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>₹{totalAmount.toLocaleString()}</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Amount</div>
            </div>
          </Card>
        </div>

        <Card 
          title="Purchase Records"
          actions={
            <Link href="/purchases/add" style={{ textDecoration: 'none' }}>
              <Button variant="primary">
                <span>➕</span>
                Record Purchase
              </Button>
            </Link>
          }
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="🔍 Search by farmer name, code, village, or packaging type..."
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
            </div>
          )}

          <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Farmer</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Process Wt</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Total Wt</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Rate/kg</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem', color: '#1f2937' }}>
                      {new Date(p.purchase_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {p.farmers?.name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {p.farmers?.farmer_code} • {p.farmers?.village}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        backgroundColor: p.packaging_type === 'BODH' ? '#dbeafe' : '#f3e8ff',
                        color: p.packaging_type === 'BODH' ? '#1e40af' : '#7c3aed'
                      }}>
                        {p.packaging_type}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#1f2937', fontWeight: '500' }}>
                      {p.process_weight} kg
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#1f2937', fontWeight: '500' }}>
                      {p.total_weight} kg
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#1f2937' }}>
                      ₹{p.rate_per_kg}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#1f2937', fontWeight: '600' }}>
                      ₹{p.total_amount?.toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧾</div>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No purchases found</p>
                <p style={{ fontSize: '0.9rem' }}>
                  {search ? 'Try adjusting your search terms' : 'Get started by recording your first purchase'}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
