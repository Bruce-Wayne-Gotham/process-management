'use client';
import React from 'react';
import Layout from '../../../components/Layout';
import Card from '../../../components/Card';

export default function JardiEditPage() {
  return (
    <Layout>
      <Card title="Edit Jardi Output">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Coming Soon</h3>
          <p>Jardi output edit page is under development.</p>
          <button 
            onClick={() => window.history.back()}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </Card>
    </Layout>
  );
}
