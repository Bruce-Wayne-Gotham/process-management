'use client';
import React from 'react';
import { supabase } from '../lib/supabaseClient';

export default function FarmersPage() {
  const [farmers, setFarmers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (apiBase) {
          const res = await fetch(`${apiBase}/farmers`);
          if (!res.ok) throw new Error(`API error ${res.status}`);
          const rows = await res.json();
          if (mounted) setFarmers(rows || []);
        } else {
          const { data, error } = await supabase
            .from('farmers')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          if (mounted) setFarmers(data || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
    return () => { mounted = false; }
  }, []);

  if (loading) return <p style={{padding: '1rem'}}>Loading...</p>;

  return (
    <main style={{padding: '2rem', fontFamily: 'Arial, sans-serif'}}>
      <h1>Farmers</h1>
      <table border="1" cellPadding="8" style={{borderCollapse:'collapse'}}>
        <thead>
          <tr><th>Code</th><th>Name</th><th>Village</th><th>Contact</th><th>Created</th></tr>
        </thead>
        <tbody>
          {farmers.map(f => (
            <tr key={f.id}>
              <td>{f.farmer_code}</td>
              <td>{f.name}</td>
              <td>{f.village}</td>
              <td>{f.contact_number}</td>
              <td>{new Date(f.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

