'use client';
import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function AddPurchasePage() {
  const router = useRouter();
  const [farmers, setFarmers] = React.useState([]);
  const [form, setForm] = React.useState({
    farmer_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    packaging_type: 'BODH',
    process_weight: '',
    packaging_weight: '',
    rate_per_kg: '',
    remarks: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [loadingFarmers, setLoadingFarmers] = React.useState(true);
  const [error, setError] = React.useState('');

  // Load farmers for dropdown
  React.useEffect(() => {
    async function loadFarmers() {
      try {
        const res = await fetch('/api/farmers');
        if (!res.ok) throw new Error('Failed to load farmers');
        const data = await res.json();
        setFarmers(data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load farmers: ' + err.message);
      } finally {
        setLoadingFarmers(false);
      }
    }
    loadFarmers();
  }, []);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = { ...form };
      
      // Convert empty strings to null for optional fields
      if (!payload.packaging_weight) payload.packaging_weight = null;
      if (!payload.remarks) payload.remarks = null;

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to record purchase (${res.status})`);
      }
      
      router.push('/purchases');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate computed values for preview
  const processWeight = Number(form.process_weight) || 0;
  const packagingWeight = Number(form.packaging_weight) || 0;
  const ratePerKg = Number(form.rate_per_kg) || 0;
  const totalWeight = processWeight + packagingWeight;
  const totalAmount = processWeight * ratePerKg;

  const fieldStyle = { 
    display: 'flex', 
    flexDirection: 'column', 
    marginBottom: '1.5rem' 
  };
  
  const labelStyle = { 
    marginBottom: '0.5rem', 
    fontWeight: '600', 
    color: '#374151',
    fontSize: '0.9rem'
  };
  
  const inputStyle = { 
    padding: '0.75rem', 
    border: '1px solid #d1d5db', 
    borderRadius: '0.5rem',
    fontSize: '1rem',
    backgroundColor: '#f9fafb',
    transition: 'border-color 0.2s'
  };

  if (loadingFarmers) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#64748b' }}>Loading farmers...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main Form */}
        <Card 
          title="Record New Purchase"
          actions={
            <Button 
              variant="secondary" 
              onClick={() => router.push('/purchases')}
            >
              ← Back to Purchases
            </Button>
          }
        >
          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Farmer *</label>
              <select 
                name="farmer_id" 
                value={form.farmer_id} 
                onChange={handleChange} 
                required 
                style={inputStyle}
              >
                <option value="">Select a farmer...</option>
                {farmers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.farmer_code} - {f.name} ({f.village || 'No village'})
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Purchase Date *</label>
              <input 
                type="date" 
                name="purchase_date" 
                value={form.purchase_date} 
                onChange={handleChange} 
                required 
                style={inputStyle} 
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Packaging Type *</label>
              <select 
                name="packaging_type" 
                value={form.packaging_type} 
                onChange={handleChange} 
                required 
                style={inputStyle}
              >
                <option value="BODH">BODH</option>
                <option value="BAG">BAG</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Process Weight (kg) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="process_weight" 
                  value={form.process_weight} 
                  onChange={handleChange} 
                  required 
                  style={inputStyle}
                  placeholder="0.00"
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Packaging Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="packaging_weight" 
                  value={form.packaging_weight} 
                  onChange={handleChange} 
                  style={inputStyle}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Rate per kg (₹) *</label>
              <input 
                type="number" 
                step="0.01" 
                name="rate_per_kg" 
                value={form.rate_per_kg} 
                onChange={handleChange} 
                required 
                style={inputStyle}
                placeholder="0.00"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Remarks</label>
              <textarea 
                name="remarks" 
                value={form.remarks} 
                onChange={handleChange} 
                rows={3} 
                style={inputStyle}
                placeholder="Any additional notes..."
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

            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
              <Button type="submit" disabled={loading} variant="primary">
                {loading ? '⏳ Recording...' : '💾 Record Purchase'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => router.push('/purchases')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        {/* Preview Card */}
        <Card title="Purchase Preview">
          <div style={{ space: '1rem' }}>
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Calculations</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6b7280' }}>Process Weight:</span>
                <span style={{ fontWeight: '500' }}>{processWeight.toFixed(2)} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6b7280' }}>Packaging Weight:</span>
                <span style={{ fontWeight: '500' }}>{packagingWeight.toFixed(2)} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: '600' }}>Total Weight:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>{totalWeight.toFixed(2)} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: '600' }}>Total Amount:</span>
                <span style={{ fontWeight: '600', color: '#dc2626', fontSize: '1.1rem' }}>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
              <p><strong>Note:</strong> Total amount is calculated as Process Weight × Rate per kg. Packaging weight is added to total weight but not charged.</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
