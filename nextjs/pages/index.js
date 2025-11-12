import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Link from 'next/link';

export default function Home() {
  const stats = [
    { label: 'Total Farmers', value: '0', icon: '👨‍🌾', color: '#3b82f6' },
    { label: 'Active Purchases', value: '0', icon: '🧾', color: '#10b981' },
    { label: 'Processing Lots', value: '0', icon: '📦', color: '#f59e0b' },
    { label: 'Completed Processes', value: '0', icon: '✅', color: '#8b5cf6' },
  ];

  const quickActions = [
    { label: 'Add Farmer', href: '/farmers/add', icon: '👨‍🌾', color: '#3b82f6' },
    { label: 'Record Purchase', href: '/purchases/add', icon: '🧾', color: '#10b981' },
    { label: 'Create Lot', href: '/lots/add', icon: '📦', color: '#f59e0b' },
    { label: 'View Reports', href: '/reports', icon: '📊', color: '#8b5cf6' },
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f1f5f9';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>
                  {action.icon}
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#1e293b'
                }}>
                  {action.label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </Layout>
  );
}
