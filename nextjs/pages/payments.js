import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Link from 'next/link';

export default function PaymentsPage() {
  const [payments, setPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        console.log('Loading payments...');
        const res = await fetch('/api/payments');
        console.log('Payments API response:', res.status);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const rows = await res.json();
        console.log('Payments data:', rows);
        if (mounted) {
          setPayments(rows || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Payments loading error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; }
  }, []);

  const filtered = payments.filter(payment =>
    payment.purchases?.farmers?.name?.toLowerCase().includes(search.toLowerCase()) ||
    payment.purchases?.farmers?.farmer_code?.toLowerCase().includes(search.toLowerCase()) ||
    payment.payment_mode?.toLowerCase().includes(search.toLowerCase()) ||
    payment.transaction_ref?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading payments...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <Card title="❌ Error Loading Payments">
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
        <Button onClick={() => window.location.reload()}>
          🔄 Retry
        </Button>
      </Card>
    </Layout>
  );

  const totalPaid = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount_paid) || 0), 0);

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            💰 Payments Management
          </h1>
          <Link href="/payments/add" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              ➕ Record Payment
            </Button>
          </Link>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Track and manage farmer payments and transactions
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{payments.length}</div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Payments</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💵</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
              ₹{totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Amount</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {payments.filter(p => p.payment_mode !== 'CASH').length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Digital Payments</div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {payments.filter(p => {
                const paymentDate = new Date(p.payment_date);
                const today = new Date();
                const diffTime = Math.abs(today - paymentDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
              }).length}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>This Week</div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card title="🔍 Search & Filter">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by farmer name, code, or transaction..."
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

      {/* Payments Table */}
      <Card title={`💰 Payments (${filtered.length})`}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No payments found</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              {payments.length === 0 ? 'Record your first payment to get started' : 'Try adjusting your search criteria'}
            </p>
            <Link href="/payments/add" style={{ textDecoration: 'none' }}>
              <Button variant="primary">
                ➕ Record First Payment
              </Button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Farmer
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Payment Date
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Amount Paid
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Mode
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>
                    Transaction Ref
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
                {filtered.map((payment, index) => (
                  <tr key={payment.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '500', color: '#1e293b' }}>
                        {payment.purchases?.farmers?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {payment.purchases?.farmers?.farmer_code} • {payment.purchases?.farmers?.village}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                      <span style={{ fontWeight: '500', color: '#059669' }}>
                        ₹{parseFloat(payment.amount_paid).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: payment.payment_mode === 'CASH' ? '#f3f4f6' : '#dcfce7',
                        color: payment.payment_mode === 'CASH' ? '#6b7280' : '#166534'
                      }}>
                        {payment.payment_mode}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      {payment.transaction_ref || '-'}
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      {payment.remarks || '-'}
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
