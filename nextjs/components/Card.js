export default function Card({ children, title, actions, className = '' }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }} className={className}>
      {title && (
        <div style={{
          padding: 'clamp(1rem, 3vw, 1.5rem)',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
            fontWeight: '600', 
            color: '#1e293b',
            wordBreak: 'break-word'
          }}>
            {title}
          </h2>
          {actions && (
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'flex-end'
            }}>
              {actions}
            </div>
          )}
        </div>
      )}
      <div style={{ 
        padding: title ? 'clamp(1rem, 3vw, 1.5rem)' : 'clamp(1.5rem, 4vw, 2rem)',
        overflowX: 'auto'
      }}>
        {children}
      </div>
    </div>
  );
}
