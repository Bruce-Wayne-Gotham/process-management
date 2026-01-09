'use client';
import React from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AddProcessPage() {
  const router = useRouter();
  const [lots, setLots] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const [formData, setFormData] = React.useState({
    process_code: '',
    lot_id: '',
    process_date: new Date().toISOString().split('T')[0],
    input_weight: '',
    kadi_mati_weight: '0',
    dhas_weight: '0'
  });

  React.useEffect(() => {
    async function loadLots() {
      try {
        const res = await fetch('/api/lots');
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        setLots(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Lots loading error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    loadLots();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateProcessCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData(prev => ({
      ...prev,
      process_code: `PR${dateStr}${random}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API error ${res.status}`);
      }

      const newProcess = await res.json();
      router.push(`/process?created=1`);
    } catch (err) {
      console.error('Process creation error:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading lots...</p>
      </div>
    </Layout>
  );

  if (error && !formData.process_code) return (
    <Layout>
      <Card title="❌ Error Loading Lots">
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
        <Button onClick={() => window.location.reload()}>
          🔄 Retry
        </Button>
      </Card>
    </Layout>
  );

  const selectedLot = lots.find(lot => lot.id === parseInt(formData.lot_id));
  const totalWastage = (parseFloat(formData.kadi_mati_weight) || 0) + (parseFloat(formData.dhas_weight) || 0);
  const netLoss = (parseFloat(formData.input_weight) || 0) - totalWastage;

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Link href="/process" style={{ textDecoration: 'none' }}>
            <Button variant="outline">← Back</Button>
          </Link>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            ⚙️ Start New Process
          </h1>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Create a new tobacco processing batch
        </p>
      </div>

      <Card title="📋 Process Information">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Process Code */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Process Code *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  name="process_code"
                  value={formData.process_code}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., PR20241112001"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
                <Button type="button" variant="outline" onClick={generateProcessCode}>
                  🎲 Generate
                </Button>
              </div>
            </div>

            {/* Lot Selection */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Select Lot *
              </label>
              <select
                name="lot_id"
                value={formData.lot_id}
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
                <option value="">Choose a lot...</option>
                {lots.map(lot => (
                  <option key={lot.id} value={lot.id}>
                    {lot.lot_code} - {lot.remarks} ({new Date(lot.lot_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {selectedLot && (
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Lot: {selectedLot.lot_code} • Date: {new Date(selectedLot.lot_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Process Date */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Process Date *
              </label>
              <input
                type="date"
                name="process_date"
                value={formData.process_date}
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

            {/* Input Weight */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Input Weight (kg) *
              </label>
              <input
                type="number"
                name="input_weight"
                value={formData.input_weight}
                onChange={handleInputChange}
                required
                min="0"
                step="0.1"
                placeholder="0.0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Kadi Mati Weight */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Kadi Mati Weight (kg)
              </label>
              <input
                type="number"
                name="kadi_mati_weight"
                value={formData.kadi_mati_weight}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                placeholder="0.0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Dhas Weight */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Dhas Weight (kg)
              </label>
              <input
                type="number"
                name="dhas_weight"
                value={formData.dhas_weight}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                placeholder="0.0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Calculations Summary */}
          {(formData.input_weight || formData.kadi_mati_weight || formData.dhas_weight) && (
            <Card title="📊 Calculations" style={{ marginTop: '1.5rem', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Wastage</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>
                    {totalWastage.toFixed(1)} kg
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Net Loss</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: netLoss >= 0 ? '#059669' : '#dc2626' }}>
                    {netLoss.toFixed(1)} kg
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Loss %</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>
                    {formData.input_weight ? ((totalWastage / parseFloat(formData.input_weight)) * 100).toFixed(1) : '0.0'}%
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
              <p style={{ margin: 0, color: '#dc2626' }}>❌ {error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
            <Link href="/process" style={{ textDecoration: 'none' }}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving || !formData.process_code || !formData.lot_id || !formData.input_weight}>
              {saving ? '⏳ Creating...' : '⚙️ Start Process'}
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
