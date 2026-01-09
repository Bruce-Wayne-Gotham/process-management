'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '[D]' },
    { href: '/farmers', label: 'Farmers', icon: '[F]' },
    { href: '/purchases', label: 'Purchases', icon: '[P]' },
    { href: '/lots', label: 'Lots', icon: '[L]' },
    { href: '/process', label: 'Process', icon: '[PR]' },
    { href: '/payments', label: 'Payments', icon: '[PA]' },
    { href: '/manual-setup', label: 'Setup Database', icon: '[S]' }
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
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 'bold' }}>
              Tobacco Tracker
            </h1>
            <div style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', opacity: 0.8 }}>
              Process Management System
            </div>
          </div>
          {/* Mobile menu button */}
          <button 
            onClick={() => {
              const nav = document.getElementById('mobile-nav');
              nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
            }}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            ☰
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', flexDirection: 'row' }}>
        {/* Sidebar Navigation */}
        <nav id="mobile-nav" style={{
          width: '250px',
          backgroundColor: 'white',
          minHeight: 'calc(100vh - 80px)',
          borderRight: '1px solid #e2e8f0',
          padding: '1.5rem 0',
          position: 'sticky',
          top: '80px',
          height: 'calc(100vh - 80px)',
          overflowY: 'auto'
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
          padding: '1rem',
          backgroundColor: '#f8fafc',
          overflowX: 'auto'
        }}>
          {children}
        </main>
      </div>

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          header button {
            display: block !important;
          }
          
          #mobile-nav {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            z-index: 200 !important;
            display: none !important;
            background-color: white !important;
            border-right: none !important;
          }
          
          #mobile-nav.show {
            display: flex !important;
          }
          
          main {
            padding: 1rem !important;
          }
          
          div[style*="flex-direction: row"] {
            flex-direction: column !important;
          }
        }
        
        @media (max-width: 1024px) {
          nav {
            width: 200px !important;
          }
        }
        
        @media (max-width: 640px) {
          header {
            padding: 0.75rem !important;
          }
          
          main {
            padding: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
