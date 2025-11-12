import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h1>Tobacco Tracker</h1>
      <p style={{ marginBottom: '1.5rem' }}>Manage farmers, purchases, lots, and processing.</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '0.75rem' }}>
          <Link href="/farmers" style={{ textDecoration: 'none', color: '#0070f3', fontWeight: 'bold', fontSize: '1.1rem' }}>
            Farmers
          </Link>
        </li>
      </ul>
    </main>
  );
}
