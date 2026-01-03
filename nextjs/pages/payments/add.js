'use client';
import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';

const PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

export default function AddPaymentPage() {
  const router = useRouter();
  const [purchases, setPurchases] = React.useState([]);
  const [loadingPurchases, setLoadingPurchases] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({
    purchase_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount_paid: '',
    payment_mode: 'CASH',
    transaction_ref: '',
    remarks: ''
  });

  React.useEffect(() => {
    async function loadPurchases() {
      try {
        const res = await fetch('/api/purchases');
        if (!res.ok) throw new Error(`Failed to load purchases (${res.status})`);
        const data = await res.json();
        setPurchases(data || []);
      } catch (err) {
        console.error('Failed to load purchases', err);
        setError(err.message);
      } finally {
        setLoadingPurchases(false);
      }
    }
    loadPurchases();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        purchase_id: form.purchase_id ? Number(form.purchase_id) : null,
        amount_paid: form.amount_paid ? Number(form.amount_paid) : null,
        transaction_ref: form.transaction_ref || null,
        remarks: form.remarks || null
      };

      if (!payload.purchase_id || !payload.amount_paid) {
        throw new Error('Purchase and amount are required');
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to record payment (${res.status})`);
      }

      router.push('/payments');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPurchase = purchases.find((p) => String(p.id) === String(form.purchase_id));

  if (loadingPurchases) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#64748b' }}>Loading purchases...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <Card
          title="Record Payment"
          actions={
            <Button variant="secondary" onClick={() => router.push('/payments')}>
              ← Back to Payments
            </Button>
          }
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
              <label style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                Purchase *
              </label>
              <select
                name="purchase_id"
                value={form.purchase_id}
                onChange={handleChange}
                required
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  backgroundColor: '#f9fafb'
                }}
              >
                <option value="">Select a purchase...</option>
                {purchases.map((purchase) => (
                  <option key={purchase.id} value={purchase.id}>
                    {purchase.farmers?.farmer_code || 'N/A'} — {purchase.farmers?.name || 'Unknown'} ({new Date(purchase.purchase_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                  Payment Date *
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={form.payment_date}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    backgroundColor: '#f9fafb'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="amount_paid"
                  value={form.amount_paid}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    backgroundColor: '#f9fafb'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                  Payment Mode *
                </label>
                <select
                  name="payment_mode"
                  value={form.payment_mode}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    backgroundColor: '#f9fafb'
                  }}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
                <label style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                  Transaction Reference
                </label>
                <input
                  name="transaction_ref"
                  value={form.transaction_ref}
                  onChange={handleChange}
                  placeholder="Optional reference or UPI transaction ID"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    backgroundColor: '#f9fafb'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
              <label style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                Remarks
              </label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows={3}
                placeholder="Optional notes about this payment..."
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  backgroundColor: '#f9fafb',
                  resize: 'vertical'
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  color: '#dc2626',
                  marginBottom: '1.5rem'
                }}
              >
                <strong>Error:</strong> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? '⏳ Recording...' : '💾 Record Payment'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/payments')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="🧾 Purchase Summary">
            {selectedPurchase ? (
              <div style={{ color: '#374151', lineHeight: 1.8 }}>
                <p style={{ margin: 0 }}>
                  <strong>Farmer:</strong> {selectedPurchase.farmers?.name || 'Unknown'} ({selectedPurchase.farmers?.farmer_code || 'N/A'})
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Village:</strong> {selectedPurchase.farmers?.village || '—'}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Date:</strong> {new Date(selectedPurchase.purchase_date).toLocaleDateString()}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Packaging:</strong> {selectedPurchase.packaging_type}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Process Weight:</strong> {selectedPurchase.process_weight} kg
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Total Weight:</strong> {selectedPurchase.total_weight} kg
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Rate / kg:</strong> ₹{selectedPurchase.rate_per_kg}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Total Amount:</strong> ₹{(selectedPurchase.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            ) : (
              <p style={{ color: '#64748b', margin: 0 }}>
                Select a purchase to see its details.
              </p>
            )}
          </Card>

          <Card title="💡 Tips">
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#64748b', lineHeight: 1.6 }}>
              <li>Record payments after confirming transfer details.</li>
              <li>Use transaction reference for digital payments to simplify audits.</li>
              <li>Visit the payments list to verify totals after saving.</li>
            </ul>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
