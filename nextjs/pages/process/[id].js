import React from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ProcessViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [process, setProcess] = React.useState(null);
  const [statuses, setStatuses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [updating, setUpdating] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    
    async function loadData() {
      try {
        const [processRes, statusRes] = await Promise.all([
          fetch(`/api/process/${id}`),
          fetch('/api/process/status')
        ]);

        if (!processRes.ok) throw new Error(`Process error ${processRes.status}`);
        if (!statusRes.ok) throw new Error(`Status error ${statusRes.status}`);

        const processData = await processRes.json();
        const statusData = await statusRes.json();

        setProcess(processData);
        setStatuses(statusData || []);
        setLoading(false);
      } catch (err) {
        console.error('Data loading error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    loadData();
  }, [id]);

  const handleStatusUpdate = async (newStatusId) => {
    setUpdating(true);
    setError('');

    try {
      const res = await fetch(`/api/process/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status_id: newStatusId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API error ${res.status}`);
      }

      const updatedProcess = await res.json();
      setProcess(updatedProcess);
    } catch (err) {
      console.error('Status update error:', err);
      setError(err.message);
    } finally {
      setUpdating(false);
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

  if (error) return (
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

  const totalWastage = (parseFloat(process.kadi_mati_weight) || 0) + (parseFloat(process.dhas_weight) || 0);
  const netLoss = (parseFloat(process.input_weight) || 0) - totalWastage;
  const lossPercentage = process.input_weight ? (totalWastage / parseFloat(process.input_weight)) * 100 : 0;

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Link href="/process" style={{ textDecoration: 'none' }}>
            <Button variant="outline">← Back</Button>
          </Link>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            ⚙️ Process Details
          </h1>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>
          View and manage process {process.process_code}
        </p>
      </div>

      {/* Process Header */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Process Code</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>{process.process_code}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Lot</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
              {process.lots?.lot_code || 'Unknown'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Process Date</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
              {new Date(process.process_date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Status</div>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
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

      {/* Weight Calculations */}
      <Card title="⚖️ Weight Analysis" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📥</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
              {(parseFloat(process.input_weight) || 0).toFixed(1)} kg
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Input Weight</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗑️</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
              {totalWastage.toFixed(1)} kg
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Total Wastage</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fefce8', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📉</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: netLoss >= 0 ? '#059669' : '#dc2626' }}>
              {netLoss.toFixed(1)} kg
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Net Loss</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {lossPercentage.toFixed(1)}%
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Loss Percentage</div>
          </div>
        </div>
        
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Wastage Breakdown</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Kadi Mati</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#dc2626' }}>
                {(parseFloat(process.kadi_mati_weight) || 0).toFixed(1)} kg
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Dhas</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#dc2626' }}>
                {(parseFloat(process.dhas_weight) || 0).toFixed(1)} kg
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Status Management */}
      {process.process_status?.status_code !== 'COMPLETED' && (
        <Card title="🔄 Update Status" style={{ marginTop: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: '#64748b' }}>
              Current Status: <strong>{process.process_status?.label}</strong>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {statuses.map(status => (
              <Button
                key={status.id}
                variant={status.id === process.status_id ? 'primary' : 'outline'}
                onClick={() => handleStatusUpdate(status.id)}
                disabled={updating || status.id === process.status_id}
              >
                {status.label}
              </Button>
            ))}
          </div>
          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
              <p style={{ margin: 0, color: '#dc2626', fontSize: '0.875rem' }}>❌ {error}</p>
            </div>
          )}
        </Card>
      )}

      {/* Actions */}
      <Card title="🔧 Actions" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {process.process_status?.status_code !== 'COMPLETED' && (
            <Link href={`/process/${id}/edit`} style={{ textDecoration: 'none' }}>
              <Button variant="primary">✏️ Edit Process</Button>
            </Link>
          )}
          {process.process_status?.status_code === 'COMPLETED' && (
            <Link href={`/jardi/add?process_id=${id}`} style={{ textDecoration: 'none' }}>
              <Button variant="primary">🍂 Add Jardi Output</Button>
            </Link>
          )}
          <Link href="/process" style={{ textDecoration: 'none' }}>
            <Button variant="outline">← Back to List</Button>
          </Link>
        </div>
      </Card>
    </Layout>
  );
}
