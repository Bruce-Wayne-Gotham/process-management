import React from 'react';
import Layout from '../../../components/Layout';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function EditProcessPage() {
  const router = useRouter();
  const { id } = router.query;
  const [process, setProcess] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const [formData, setFormData] = React.useState({
    kadi_mati_weight: '0',
    dhas_weight: '0',
    remarks: ''
  });

  React.useEffect(() => {
    if (!id) return;
    
    async function loadProcess() {
      try {
        const res = await fetch(`/api/process/${id}`);
        if (!res.ok) throw new Error(`Process error ${res.status}`);
        const data = await res.json();

        setProcess(data);
        setFormData({
          kadi_mati_weight: (parseFloat(data.kadi_mati_weight) || 0).toString(),
          dhas_weight: (parseFloat(data.dhas_weight) || 0).toString(),
          remarks: data.remarks || ''
        });
        setLoading(false);
      } catch (err) {
        console.error('Process loading error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    loadProcess();
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
      const res = await fetch(`/api/process/${id}`, {
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

      router.push(`/process/${id}`);
    } catch (err) {
      console.error('Process update error:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading process details...</p>
      </div>
    </Layout>
  );

  if (error && !process) return (
    <Layout>
      <Card title="❌ Error Loading Process">
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
        <Button onClick={() => window.location.reload()}>
          🔄 Retry
        </Button>
      </Card>
    </Layout>
  );

  if (!process) return (
    <Layout>
      <Card title="❌ Process Not Found">
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>The requested process could not be found.</p>
        <Link href="/process" style={{ textDecoration: 'none' }}>
          <Button>← Back to Processes</Button>
        </Link>
      </Card>
    </Layout>
  );

  if (process.process_status?.status_code === 'COMPLETED') {
    return (
      <Layout>
        <Card title="⚠️ Process Already Completed">
          <p style={{ color: '#d97706', marginBottom: '1rem' }}>
            This process has been marked as completed and cannot be edited.
          </p>
          <Link href={`/process/${id}`} style={{ textDecoration: 'none' }}>
            <Button variant="primary">View Process Details</Button>
          </Link>
        </Card>
      </Layout>
    );
  }

  const totalWastage = (parseFloat(formData.kadi_mati_weight) || 0) + (parseFloat(formData.dhas_weight) || 0);
  const netLoss = (parseFloat(process.input_weight) || 0) - totalWastage;
  const lossPercentage = process.input_weight ? (totalWastage / parseFloat(process.input_weight)) * 100 : 0;

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Link href={`/process/${id}`} style={{ textDecoration: 'none' }}>
            <Button variant="outline">← Back</Button>
          </Link>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            ✏️ Edit Process
          </h1>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          Update wastage details for process {process.process_code}
        </p>
      </div>

      {/* Process Info Summary */}
      <Card style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Process Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Process Code</div>
            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{process.process_code}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Lot</div>
            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{process.lots?.lot_code}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Input Weight</div>
            <div style={{ fontWeight: 'bold', color: '#059669' }}>{process.input_weight} kg</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Status</div>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '500',
              backgroundColor: process.process_status?.status_code === 'COMPLETED' ? '#dcfce7' : 
                             process.process_status?.status_code === 'IN_PROGRESS' ? '#fef3c7' : '#f3f4f6',
              color: process.process_status?.status_code === 'COMPLETED' ? '#166534' : 
                     process.process_status?.status_code === 'IN_PROGRESS' ? '#92400e' : '#6b7280'
            }}>
              {process.process_status?.label || 'Pending'}
            </span>
          </div>
        </div>
      </Card>

      <Card title="📊 Update Wastage Details">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
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
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                Weight of kadi mati wastage
              </p>
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
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                Weight of dhas wastage
              </p>
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
                placeholder="Add any notes about this process..."
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

          {/* Calculations Summary */}
          <Card title="📊 Updated Calculations" style={{ marginTop: '1.5rem', backgroundColor: '#f8fafc' }}>
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
                  {lossPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>

          {/* Error Display */}
          {error && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
              <p style={{ margin: 0, color: '#dc2626' }}>❌ {error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
            <Link href={`/process/${id}`} style={{ textDecoration: 'none' }}>
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
