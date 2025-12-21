export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  type = 'button',
  className = '',
  ...props 
}) {
  const variants = {
    primary: {
      backgroundColor: disabled ? '#94a3b8' : '#3b82f6',
      color: 'white',
      border: 'none'
    },
    secondary: {
      backgroundColor: disabled ? '#f1f5f9' : '#f8fafc',
      color: disabled ? '#94a3b8' : '#475569',
      border: '1px solid #e2e8f0'
    },
    success: {
      backgroundColor: disabled ? '#94a3b8' : '#10b981',
      color: 'white',
      border: 'none'
    },
    danger: {
      backgroundColor: disabled ? '#94a3b8' : '#ef4444',
      color: 'white',
      border: 'none'
    },
    outline: {
      backgroundColor: 'transparent',
      color: disabled ? '#94a3b8' : '#3b82f6',
      border: `1px solid ${disabled ? '#94a3b8' : '#3b82f6'}`
    }
  };

  const sizes = {
    sm: { padding: 'clamp(0.4rem, 2vw, 0.5rem) clamp(0.6rem, 3vw, 0.75rem)', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' },
    md: { padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.8rem, 3vw, 1rem)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' },
    lg: { padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.2rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: '0.5rem',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        whiteSpace: 'nowrap',
        wordBreak: 'keep-all',
        minWidth: 'fit-content',
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...props.style
      }}
      onMouseEnter={(e) => {
        if (!disabled && variant === 'primary') {
          e.target.style.backgroundColor = '#2563eb';
        }
        if (!disabled && variant === 'secondary') {
          e.target.style.backgroundColor = '#f1f5f9';
        }
        if (!disabled && variant === 'success') {
          e.target.style.backgroundColor = '#059669';
        }
        if (!disabled && variant === 'danger') {
          e.target.style.backgroundColor = '#dc2626';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = variants[variant].backgroundColor;
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}
