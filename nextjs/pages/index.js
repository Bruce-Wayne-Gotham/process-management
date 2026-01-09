'use client';
import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = React.useState([
    { label: 'Total Farmers', value: '0', icon: '👨‍🌾', color: '#3b82f6' },
    { label: 'Active Purchases', value: '0', icon: '🧾', color: '#10b981' },
    { label: 'Processing Lots', value: '0', icon: '📦', color: '#f59e0b' },
    { label: 'Completed Processes', value: '0', icon: '✅', color: '#8b5cf6' },
  ]);

  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        // First check health
        const healthRes = await fetch('/api/health');
        if (!healthRes.ok) throw new Error('Health check failed');
        const health = await healthRes.json();

        if (!health.database?.connected) {
          setError(health.database?.error || 'Database not connected');
          setLoading(false);
          return;
        }

        // Load farmers count
        const farmersRes = await fetch('/api/farmers');
        if (!farmersRes.ok) throw new Error('Failed to load farmers');
        const farmers = await farmersRes.json();
        const farmerCount = farmers.length;

        // Load purchases count
        const purchasesRes = await fetch('/api/purchases');
        let purchaseCount = 0;
        if (purchasesRes.ok) {
          const purchases = await purchasesRes.json();
          purchaseCount = purchases.length;
        }

        // Update stats with real data
        setStats([
          { label: 'Total Farmers', value: farmerCount.toString(), icon: '👨‍🌾', color: '#3b82f6' },
          { label: 'Active Purchases', value: purchaseCount.toString(), icon: '🧾', color: '#10b981' },
          { label: 'Processing Lots', value: '0', icon: '📦', color: '#f59e0b' },
          { label: 'Completed Processes', value: '0', icon: '✅', color: '#8b5cf6' },
        ]);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const quickActions = [
    {
      label: 'Add Farmer',
      description: 'Register a new farmer',
      href: '/farmers/add',
      icon: '👨‍🌾',
      color: '#3b82f6'
    },
    {
      label: 'Record Purchase',
      description: 'Add tobacco purchase',
      href: '/purchases/add',
      icon: '🧾',
      color: '#10b981'
    },
    {
      label: 'Record Payment',
      description: 'Log a payout to a farmer',
      href: '/payments/add',
      icon: '💰',
      color: '#8b5cf6'
    },
    {
      label: 'Create Lot',
      description: 'Group purchases into lots',
      href: '/lots/add',
      icon: '📦',
      color: '#f59e0b'
    }
  ];

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
          Dashboard
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
          Welcome to your tobacco processing management system
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner">⌛ Loading dashboard data...</div>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#991b1b'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>⚠️ Connection Error</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            Please check your AWS RDS security groups and environment variables.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {stats.map((stat, index) => (
          <Card key={index}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                  {stat.label}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {stat.value}
                </p>
              </div>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                backgroundColor: `${stat.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <Link href="/manual-setup" style={{ textDecoration: 'none' }}>
            <Card style={{ cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' }, border: '2px solid #f59e0b' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛠️</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#d97706' }}>Setup Database</h3>
                <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem', fontWeight: '500' }}>Required first step!</p>
              </div>
            </Card>
          </Link>
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href} style={{ textDecoration: 'none' }}>
              <Card style={{ cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{action.icon}</div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{action.label}</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{action.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Card>
    </Layout>
  );
}
