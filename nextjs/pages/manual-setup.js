'use client';
import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';

export default function ManualSetupPage() {
  const [copied, setCopied] = React.useState(false);

  const sqlScript = `-- Run this in Supabase SQL Editor:

-- farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id SERIAL PRIMARY KEY,
  farmer_code VARCHAR(20) UNIQUE,
  name VARCHAR(100) NOT NULL,
  village VARCHAR(100),
  contact_number VARCHAR(20),
  aadhaar_no VARCHAR(20),
  dob DATE,
  account_holder_name VARCHAR(100),
  bank_name VARCHAR(100),
  branch_name VARCHAR(100),
  account_number VARCHAR(30),
  ifsc_code VARCHAR(15),
  upi_id VARCHAR(50),
  efficacy_score DECIMAL(5,2) DEFAULT 0,
  efficacy_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  farmer_id INT REFERENCES farmers(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL,
  packaging_type VARCHAR(10) CHECK (packaging_type IN ('BODH','BAG')),
  process_weight DECIMAL(10,2) NOT NULL,
  packaging_weight DECIMAL(10,2) DEFAULT 0,
  total_weight DECIMAL(10,2) GENERATED ALWAYS AS (process_weight + packaging_weight) STORED,
  rate_per_kg DECIMAL(10,2),
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (process_weight * rate_per_kg) STORED,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- lots table
CREATE TABLE IF NOT EXISTS lots (
  id SERIAL PRIMARY KEY,
  lot_code VARCHAR(20) UNIQUE NOT NULL,
  lot_date DATE NOT NULL,
  total_input_weight DECIMAL(10,2) DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on farmers" ON farmers FOR ALL USING (true);
CREATE POLICY "Allow all operations on purchases" ON purchases FOR ALL USING (true);
CREATE POLICY "Allow all operations on lots" ON lots FOR ALL USING (true);

-- Insert sample data
INSERT INTO farmers (farmer_code, name, village, contact_number, efficacy_score) VALUES
('F001', 'Rajesh Kumar', 'Khandwa', '9876543210', 8.5),
('F002', 'Suresh Patel', 'Dewas', '9876543211', 7.2),
('F003', 'Mahesh Singh', 'Ujjain', '9876543212', 9.1),
('F004', 'Ramesh Sharma', 'Indore', '9876543213', 6.8),
('F005', 'Dinesh Verma', 'Bhopal', '9876543214', 8.9)
ON CONFLICT (farmer_code) DO NOTHING;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Card title="🛠️ Manual Database Setup">
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#374151', marginBottom: '1rem' }}>Quick Setup Instructions</h3>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '2rem' }}>
              <ol style={{ color: '#166534', lineHeight: '1.8', paddingLeft: '1.5rem', margin: 0 }}>
                <li><strong>Go to Supabase Dashboard:</strong> <a href="https://supabase.com/dashboard" target="_blank" style={{ color: '#059669', textDecoration: 'underline' }}>https://supabase.com/dashboard</a></li>
                <li><strong>Navigate to your project:</strong> wueblvkoukloirisuoju</li>
                <li><strong>Click "SQL Editor"</strong> in the left sidebar</li>
                <li><strong>Copy the SQL script below</strong> and paste it in the editor</li>
                <li><strong>Click "Run"</strong> to execute the script</li>
                <li><strong>Come back and test:</strong> <a href="/farmers" style={{ color: '#059669', textDecoration: 'underline' }}>Visit Farmers Page</a></li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <Button variant="primary" onClick={copyToClipboard}>
                {copied ? '✅ Copied!' : '📋 Copy SQL Script'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              >
                🚀 Open Supabase Dashboard
              </Button>
            </div>
          </div>

          <Card title="📝 SQL Script">
            <pre style={{
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              maxHeight: '500px'
            }}>
              {sqlScript}
            </pre>
          </Card>

          <Card title="✅ After Running the Script" style={{ marginTop: '2rem' }}>
            <div style={{ color: '#374151', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '1rem' }}>
                <strong>What you'll get:</strong>
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                <li>✅ Farmers table with 5 sample farmers</li>
                <li>✅ Purchases table ready for data</li>
                <li>✅ Auto-calculated total weight and amount columns</li>
                <li>✅ Row Level Security policies configured</li>
                <li>✅ Sample data to test the application</li>
              </ul>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <Button 
                  variant="primary" 
                  onClick={() => window.location.href = '/farmers'}
                >
                  👥 Test Farmers Page
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => window.location.href = '/purchases'}
                >
                  🧾 Test Purchases Page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                >
                  📊 Back to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </Card>
      </div>
    </Layout>
  );
}
