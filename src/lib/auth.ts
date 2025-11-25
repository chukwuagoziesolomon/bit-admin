// Authentication utility functions
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};


export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    // Set cookie for middleware (expires in 7 days)
    document.cookie = `authToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
  }
};


export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    // Remove cookie
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

export const logout = (): void => {
  removeAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
};
