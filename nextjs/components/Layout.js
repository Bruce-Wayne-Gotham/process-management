import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/farmers', label: 'Farmers', icon: '👨‍🌾' },
    { href: '/purchases', label: 'Purchases', icon: '🧾' },
    { href: '/lots', label: 'Lots', icon: '📦' },
    { href: '/process', label: 'Process', icon: '⚙️' },
    { href: '/jardi', label: 'Jardi Output', icon: '🍂' },
    { href: '/payments', label: 'Payments', icon: '💰' },
    { href: '/manual-setup', label: 'Setup Database', icon: '🛠️' }
  ];

  const isActive = (href) => {
    if (href === '/') return router.pathname === '/';
    return router.pathname.startsWith(href);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            🚬 Tobacco Tracker
          </h1>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Process Management System
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Sidebar Navigation */}
        <nav style={{
          width: '250px',
          backgroundColor: 'white',
          minHeight: 'calc(100vh - 80px)',
          borderRight: '1px solid #e2e8f0',
          padding: '1.5rem 0'
        }}>
          <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Navigation
            </h3>
          </div>
          
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                margin: '0.25rem 1rem',
                borderRadius: '0.5rem',
                color: isActive(item.href) ? '#1e293b' : '#64748b',
                backgroundColor: isActive(item.href) ? '#f1f5f9' : 'transparent',
                fontWeight: isActive(item.href) ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.href)) {
                  e.target.style.backgroundColor = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.href)) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.1rem' }}>
                  {item.icon}
                </span>
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: '2rem',
          backgroundColor: '#f8fafc'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
