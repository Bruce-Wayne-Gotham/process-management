'use client';
import React from 'react';
import { useRouter } from 'next/router';

export default function AddFarmerPage() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    farmer_code: '',
    name: '',
    village: '',
    contact_number: '',
    aadhaar_no: '',
    dob: '',
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    efficacy_score: '',
    efficacy_notes: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      // Convert empty strings to null for optional fields
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') payload[k] = null;
      });

      const res = await fetch('/api/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to add farmer (${res.status})`);
      }
      router.push('/farmers');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { display: 'flex', flexDirection: 'column', marginBottom: '1rem' };
  const labelStyle = { marginBottom: '0.25rem', fontWeight: 'bold' };
  const inputStyle = { padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' };

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '700px', margin: 'auto' }}>
      <h1>Add Farmer</h1>
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Farmer Code *</label>
          <input name="farmer_code" value={form.farmer_code} onChange={handleChange} required style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Village</label>
          <input name="village" value={form.village} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Contact Number</label>
          <input name="contact_number" value={form.contact_number} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Aadhaar No</label>
          <input name="aadhaar_no" value={form.aadhaar_no} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Date of Birth</label>
          <input type="date" name="dob" value={form.dob} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Account Holder Name</label>
          <input name="account_holder_name" value={form.account_holder_name} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Bank Name</label>
          <input name="bank_name" value={form.bank_name} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Branch Name</label>
          <input name="branch_name" value={form.branch_name} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Account Number</label>
          <input name="account_number" value={form.account_number} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>IFSC Code</label>
          <input name="ifsc_code" value={form.ifsc_code} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>UPI ID</label>
          <input name="upi_id" value={form.upi_id} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Efficacy Score</label>
          <input type="number" step="0.01" name="efficacy_score" value={form.efficacy_score} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Efficacy Notes</label>
          <textarea name="efficacy_notes" value={form.efficacy_notes} onChange={handleChange} rows={3} style={inputStyle} />
        </div>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => router.push('/farmers')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ccc', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
