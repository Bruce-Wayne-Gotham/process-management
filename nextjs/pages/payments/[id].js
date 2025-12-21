import React from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PaymentViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [payment, setPayment] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!id) return;
    
    async function loadPayment() {
      try {
        const res = await fetch(`/api/payments/${id}`);
        if (!res.ok) throw new Error(`Payment error ${res.status}`);
        const data = await res.json();

        setPayment(data);
        setLoading(false);
      } catch (err) {
        console.error('Payment loading error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    loadPayment();
  }, [id]);

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading payment details...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <Card title="❌ Error Loading Payment">
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
        <Button onClick={() => window.location.reload()}>
          🔄 Retry
        </Button>
      </Card>
    </Layout>
  );

  if (!payment) return (
    <Layout>
      <Card title="❌ Payment Not Found">
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>The requested payment could not be found.</p>
        <Link href="/payments" style={{ textDecoration: 'none' }}>
          <Button>← Back to Payments</Button>
        </Link>
      </Card>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Link href="/payments" style={{ textDecoration: 'none' }}>
            <Button variant="outline">← Back</Button>
          </Link>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            💰 Payment Details
          </h1>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          View payment transaction details
        </p>
      </div>

      {/* Payment Header */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Payment ID</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>#{payment.id}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Payment Date</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
              {new Date(payment.payment_date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Payment Mode</div>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              backgroundColor: payment.payment_mode === 'CASH' ? '#f3f4f6' : '#dcfce7',
              color: payment.payment_mode === 'CASH' ? '#6b7280' : '#166534'
            }}>
              {payment.payment_mode}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Amount Paid</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
              ₹{parseFloat(payment.amount_paid).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </Card>

      {/* Farmer Information */}
      <Card title="👨‍🌾 Farmer Information" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Farmer Name</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>
              {payment.purchases?.farmers?.name || 'Unknown'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Farmer Code</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>
              {payment.purchases?.farmers?.farmer_code || '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Village</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>
              {payment.purchases?.farmers?.village || '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Contact</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>
              {payment.purchases?.farmers?.contact_number || '-'}
            </div>
          </div>
        </div>
      </Card>

      {/* Purchase Information */}
      <Card title="🧾 Related Purchase" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Purchase Date</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>
              {payment.purchases ? new Date(payment.purchases.purchase_date).toLocaleDateString() : '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Process Weight</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>
              {payment.purchases ? `${parseFloat(payment.purchases.process_weight).toFixed(1)} kg` : '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Rate per kg</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>
              {payment.purchases ? `₹${parseFloat(payment.purchases.rate_per_kg).toFixed(2)}` : '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Total Amount</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#059669' }}>
              {payment.purchases ? `₹${parseFloat(payment.purchases.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '-'}
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction Details */}
      <Card title="📋 Transaction Details" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Transaction Reference</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>
              {payment.transaction_ref || 'Not provided'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Payment Status</div>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              backgroundColor: '#dcfce7',
              color: '#166534'
            }}>
              Completed
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Recorded On</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>
              {new Date(payment.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        
        {payment.remarks && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Remarks</div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', color: '#374151' }}>
              {payment.remarks}
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <Card title="🔧 Actions" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href={`/payments/${id}/edit`} style={{ textDecoration: 'none' }}>
            <Button variant="primary">✏️ Edit Payment</Button>
          </Link>
          <Link href={`/purchases/${payment.purchase_id}`} style={{ textDecoration: 'none' }}>
            <Button variant="outline">🧾 View Purchase</Button>
          </Link>
          <Link href="/payments" style={{ textDecoration: 'none' }}>
            <Button variant="outline">← Back to List</Button>
          </Link>
        </div>
      </Card>
    </Layout>
  );
}
