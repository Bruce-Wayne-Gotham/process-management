export const getUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

export const requireAuth = (role = null) => {
  const user = getUser();
  
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return false;
  }

  if (role && user.role !== role && user.role !== 'owner') {
    return false;
  }

  return true;
};

export const hasPermission = (feature) => {
  const user = getUser();
  if (!user) return false;
  if (user.role === 'owner') return true;
  if (!user.permissions || user.permissions.length === 0) return true;
  return user.permissions.includes(feature);
};
