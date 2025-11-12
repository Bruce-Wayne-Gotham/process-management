'use client';
import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';

export default function SetupPage() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [setupKey, setSetupKey] = React.useState('');

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ setupKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Setup failed (${response.status})`);
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card title="🚀 Database Setup">
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#374151', marginBottom: '1rem' }}>Setup Your Tobacco Tracker Database</h3>
            <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              This will create all necessary database tables, indexes, and sample data for your Tobacco Tracker application.
              The setup includes:
            </p>
            <ul style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
              <li>✅ 10 database tables with proper relationships</li>
              <li>✅ Performance indexes for fast queries</li>
              <li>✅ Row Level Security policies</li>
              <li>✅ 5 sample farmers with different efficacy scores</li>
              <li>✅ 5 sample purchases with auto-calculated totals</li>
              <li>✅ Process status seed data</li>
            </ul>
          </div>

          <form onSubmit={handleSetup}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Setup Key *
              </label>
              <input
                type="password"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                placeholder="Enter setup key..."
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
                Use: <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>tobacco-tracker-setup-2024</code>
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

            <Button 
              type="submit" 
              disabled={loading || !setupKey}
              variant="primary"
              style={{ marginBottom: '1rem' }}
            >
              {loading ? '⏳ Setting up database...' : '🚀 Setup Database'}
            </Button>
          </form>

          {result && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.5rem',
              marginTop: '1.5rem'
            }}>
              <h4 style={{ color: '#166534', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                🎉 Setup Completed Successfully!
              </h4>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#166534' }}>Statistics:</strong>
                <ul style={{ color: '#166534', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>👥 Farmers: {result.statistics?.farmers}</li>
                  <li>🧾 Purchases: {result.statistics?.purchases}</li>
                  <li>⚙️ Process Statuses: {result.statistics?.processStatuses}</li>
                  <li>⏱️ Duration: {result.statistics?.duration}</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#166534' }}>Next Steps:</strong>
                <ul style={{ color: '#166534', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  {result.nextSteps?.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <Button 
                  variant="primary" 
                  onClick={() => window.location.href = '/farmers'}
                >
                  👥 View Farmers
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => window.location.href = '/purchases'}
                >
                  🧾 View Purchases
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                >
                  📊 Dashboard
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fed7aa',
              borderRadius: '0.5rem',
              marginTop: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p style={{ color: '#92400e', fontWeight: '500' }}>
                Setting up your database... This may take 30-60 seconds.
              </p>
              <p style={{ color: '#92400e', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Please wait while we create tables, indexes, and sample data.
              </p>
            </div>
          )}
        </Card>

        <Card title="ℹ️ Setup Information" style={{ marginTop: '2rem' }}>
          <div style={{ color: '#6b7280', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '1rem' }}>
              <strong>What happens during setup:</strong>
            </p>
            <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Creates 10 database tables (farmers, purchases, lots, process, etc.)</li>
              <li>Sets up foreign key relationships and computed columns</li>
              <li>Creates performance indexes for fast queries</li>
              <li>Configures Row Level Security policies</li>
              <li>Inserts process status seed data</li>
              <li>Creates 5 sample farmers and 5 sample purchases</li>
              <li>Verifies everything is working correctly</li>
            </ol>
            <p style={{ marginBottom: '1rem' }}>
              <strong>After setup:</strong> Your application will be fully functional with real data.
              The farmers and purchases pages will show sample data instead of loading screens.
            </p>
            <p>
              <strong>Safe to run multiple times:</strong> The setup uses "CREATE TABLE IF NOT EXISTS" 
              and "ON CONFLICT" clauses, so it's safe to run again if needed.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
