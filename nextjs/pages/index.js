import Link from 'next/link';

export default function Home() {
  return (
    <main style={{padding: '2rem', fontFamily: 'Arial, sans-serif'}}>
      <h1>Tobacco Tracker</h1>
      <p>Minimal Next.js + Supabase starter.</p>
      <ul>
        <li><Link href='/farmers'>Farmers</Link></li>
      </ul>
    </main>
  );
}
