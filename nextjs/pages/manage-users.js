import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { getUser } from '../lib/auth';

const PERMISSIONS = {
  farmers: 'Farmers',
  purchases: 'Purchases',
  lots: 'Lots',
  process: 'Process',
  payments: 'Payments'
};

export default function ManageUsers() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'manager',
    permissions: []
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'owner') {
      router.push('/');
      return;
    }
    setUser(currentUser);
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('User created successfully');
        setFormData({ username: '', password: '', fullName: '', email: '', role: 'manager', permissions: [] });
        setShowForm(false);
        loadUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const togglePermission = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !isActive })
      });

      if (res.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Manage Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
        >
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {message && <div style={{ padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '4px', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

      {showForm && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Create New User</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Permissions (for Manager role)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.entries(PERMISSIONS).map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', backgroundColor: formData.permissions.includes(key) ? '#dbeafe' : 'white' }}>
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(key)}
                      onChange={() => togglePermission(key)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
              Create User
            </button>
          </form>
        </Card>
      )}

      <Card>
        <h2 style={{ marginTop: 0 }}>Users</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Username</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Full Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Permissions</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{u.username}</td>
                <td style={{ padding: '0.75rem' }}>{u.full_name || '-'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ padding: '0.25rem 0.5rem', backgroundColor: u.role === 'owner' ? '#fee2e2' : '#dbeafe', color: u.role === 'owner' ? '#991b1b' : '#1e40af', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  {u.permissions ? u.permissions.join(', ') : 'All'}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ color: u.is_active ? '#10b981' : '#ef4444' }}>
                    {u.is_active ? '● Active' : '● Inactive'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {u.username !== 'owner' && (
                    <button
                      onClick={() => toggleUserStatus(u.id, u.is_active)}
                      style={{ padding: '0.25rem 0.75rem', backgroundColor: u.is_active ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Layout>
  );
}
