export default function Card({ children, title, actions, className = '' }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    }} className={className}>
      {title && (
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
            {title}
          </h2>
          {actions && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {actions}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: title ? '1.5rem' : '2rem' }}>
        {children}
      </div>
    </div>
  );
}
