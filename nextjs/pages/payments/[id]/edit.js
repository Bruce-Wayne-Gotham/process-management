import React from 'react';
import Layout from '../../../components/Layout';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Link from 'next/link';
import { useRouter } from 'next/router';

const PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

export default function EditPaymentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [payment, setPayment] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const [formData, setFormData] = React.useState({
    payment_date: '',
    amount_paid: '',
    payment_mode: 'CASH',
    transaction_ref: '',
    remarks: ''
  });

  React.useEffect(() => {
    if (!id) return;
    
    async function loadPayment() {
      try {
        const res = await fetch(`/api/payments/${id}`);
        if (!res.ok) throw new Error(`Payment error ${res.status}`);
        const data = await res.json();

        setPayment(data);
        setFormData({
          payment_date: data.payment_date,
          amount_paid: data.amount_paid.toString(),
          payment_mode: data.payment_mode || 'CASH',
          transaction_ref: data.transaction_ref || '',
          remarks: data.remarks || ''
        });
        setLoading(false);
      } catch (err) {
        console.error('Payment loading error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    loadPayment();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API error ${res.status}`);
      }

      router.push(`/payments/${id}`);
    } catch (err) {
      console.error('Payment update error:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading payment details...</p>
      </div>
    </Layout>
  );

  if (error && !payment) return (
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
          <Link href={`/payments/${id}`} style={{ textDecoration: 'none' }}>
            <Button variant="outline">← Back</Button>
          </Link>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            ✏️ Edit Payment
          </h1>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Update payment transaction details
        </p>
      </div>

      {/* Payment Info Summary */}
      <Card style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Payment Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Payment ID</div>
            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>#{payment.id}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Farmer</div>
            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
              {payment.purchases?.farmers?.name || 'Unknown'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Purchase ID</div>
            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>#{payment.purchase_id}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Purchase Amount</div>
            <div style={{ fontWeight: 'bold', color: '#059669' }}>
              ₹{payment.purchases ? parseFloat(payment.purchases.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
            </div>
          </div>
        </div>
      </Card>

      <Card title="💰 Update Payment Details">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Payment Date */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Payment Date *
              </label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Amount Paid */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                name="amount_paid"
                value={formData.amount_paid}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
              {payment.purchases && (
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Total purchase: ₹{parseFloat(payment.purchases.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Payment Mode *
              </label>
              <select
                name="payment_mode"
                value={formData.payment_mode}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                {PAYMENT_MODES.map(mode => (
                  <option key={mode} value={mode}>
                    {mode.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Reference */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Transaction Reference
              </label>
              <input
                type="text"
                name="transaction_ref"
                value={formData.transaction_ref}
                onChange={handleInputChange}
                placeholder="Bank reference, UPI transaction ID, cheque number..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
              {formData.payment_mode !== 'CASH' && (
                <p style={{ fontSize: '0.875rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                  ⚠️ Recommended for non-cash payments
                </p>
              )}
            </div>

            {/* Remarks */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                placeholder="Add any notes about this payment..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
              <p style={{ margin: 0, color: '#dc2626' }}>❌ {error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
            <Link href={`/payments/${id}`} style={{ textDecoration: 'none' }}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? '⏳ Updating...' : '💾 Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
