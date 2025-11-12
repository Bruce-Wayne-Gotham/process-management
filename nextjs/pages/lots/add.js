import React from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Link from 'next/link';

export default function AddLotPage() {
  const [formData, setFormData] = React.useState({
    lot_code: '',
    lot_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/lots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error ${response.status}`);
      }

      setSuccess(true);
      setFormData({
        lot_code: '',
        lot_date: new Date().toISOString().split('T')[0],
        remarks: ''
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/lots';
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <Card title="✅ Lot Created Successfully">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ color: '#059669', marginBottom: '1rem' }}>Lot created successfully!</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Redirecting to lots page...
            </p>
            <Link href="/lots" style={{ textDecoration: 'none' }}>
              <Button variant="primary">
                📦 View All Lots
              </Button>
            </Link>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Link href="/lots" style={{ textDecoration: 'none' }}>
            <Button variant="outline">
              ← Back to Lots
            </Button>
          </Link>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            📦 Create New Lot
          </h1>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Create a new processing lot for grouping tobacco purchases
        </p>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <Card title="📝 Lot Information">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Lot Code *
              </label>
              <input
                type="text"
                name="lot_code"
                value={formData.lot_code}
                onChange={handleChange}
                placeholder="e.g., LOT001, BATCH-2024-001"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  backgroundColor: '#f9fafb'
                }}
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Unique identifier for this lot (e.g., LOT001, BATCH-2024-001)
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Lot Date *
              </label>
              <input
                type="date"
                name="lot_date"
                value={formData.lot_date}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  backgroundColor: '#f9fafb'
                }}
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Date when this lot was created or started
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Optional notes about this lot..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  backgroundColor: '#f9fafb',
                  resize: 'vertical'
                }}
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Optional notes, quality observations, or special instructions
              </p>
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

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button 
                type="submit" 
                disabled={loading || !formData.lot_code || !formData.lot_date}
                variant="primary"
                style={{ flex: 1 }}
              >
                {loading ? '⏳ Creating...' : '📦 Create Lot'}
              </Button>
              <Link href="/lots" style={{ textDecoration: 'none' }}>
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>

        <Card title="ℹ️ About Lots" style={{ marginTop: '2rem' }}>
          <div style={{ color: '#6b7280', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '1rem' }}>
              <strong>What is a Lot?</strong> A lot is a batch of tobacco purchases that will be processed together. 
              This helps organize your processing workflow and track batches through the system.
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Each lot has a unique code for easy identification</li>
              <li>Purchases can be assigned to lots for batch processing</li>
              <li>Track total input weight and processing progress</li>
              <li>Generate reports by lot for quality control</li>
            </ul>
            <p>
              <strong>Next Steps:</strong> After creating a lot, you can assign purchases to it and begin processing.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
