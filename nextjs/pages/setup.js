'use client';
import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';

export default function SetupPage() {
  return (
    <Layout>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card title="🚀 Database Setup (Manual)">
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#374151', marginBottom: '0.75rem' }}>Run the SQL once to initialize everything</h3>
            <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
              The database must be created in Supabase manually. Run the full SQL script (tables, indexes, RLS, seeds) and then refresh the app.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <Button 
              variant="primary" 
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              🚀 Open Supabase Dashboard
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => window.location.href = '/manual-setup'}
            >
              📋 Copy the Full SQL Script
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/SUPABASE_SETUP.md', '_blank')}
            >
              📖 View SUPABASE_SETUP.md
            </Button>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: '600' }}>What you'll get after running the script:</p>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', color: '#475569', lineHeight: '1.6' }}>
              <li>All tables (farmers, purchases, lots, process, jardi, payments, efficacy, status history)</li>
              <li>Computed columns & indexes</li>
              <li>RLS policies (open for this scaffold)</li>
              <li>Seeded process statuses, 5 farmers, 5 purchases</li>
            </ul>
          </div>

          <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fed7aa', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, color: '#92400e', fontWeight: '600' }}>Don’t forget environment variables:</p>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', color: '#92400e', lineHeight: '1.6' }}>
              <li><code>SUPABASE_URL</code> and <code>SUPABASE_KEY</code> (service role) for server APIs</li>
              <li><code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> for client</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
