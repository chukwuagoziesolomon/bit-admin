# Admin Authentication - Integration Examples

## Example 1: Basic Page Protection

```typescript
// src/app/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function ProductsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1>Products Page</h1>
        {/* Your content here */}
      </main>
    </div>
  );
}
```

## Example 2: Using ProtectedRoute Component

```typescript
// src/app/orders/page.tsx
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-900">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1>Orders Page</h1>
          {/* Your content here */}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

## Example 3: API Call with Authentication

```typescript
// Making an authenticated API call
import { getAuthToken } from '@/lib/auth';

async function fetchUserData() {
  const token = getAuthToken();
  
  if (!token) {
    console.error('No authentication token');
    return null;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/';
      return null;
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}
```

## Example 4: POST Request with Authentication

```typescript
// Making an authenticated POST request
import { getAuthToken } from '@/lib/auth';

async function createProduct(productData: {
  name: string;
  price: number;
  description: string;
}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/products/create/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create product');
  }

  return response.json();
}

// Usage in component
async function handleCreateProduct(data) {
  try {
    const newProduct = await createProduct(data);
    console.log('Product created:', newProduct);
    // Update UI
  } catch (error) {
    console.error('Error:', error.message);
    // Show error to user
  }
}
```

## Example 5: Custom Hook for Protected Data Fetching

```typescript
// hooks/useProtectedFetch.ts
import { useEffect, useState } from 'react';
import { getAuthToken, logout } from '@/lib/auth';

interface UseFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

export function useProtectedFetch<T>(
  url: string,
  options?: UseFetchOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          logout();
          return;
        }

        const headers: HeadersInit = {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`,
          {
            method: options?.method || 'GET',
            headers,
            body: options?.body ? JSON.stringify(options.body) : undefined,
          }
        );

        if (response.status === 401) {
          logout();
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An error occurred'
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// Usage in component
function MyComponent() {
  const { data: users, loading, error } = useProtectedFetch(
    '/api/admin/users/'
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {users?.map((user) => (
        <div key={user.id}>{user.email}</div>
      ))}
    </div>
  );
}
```

## Example 6: Login Form Component

```typescript
// components/AdminLoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken } from '@/lib/auth';

export default function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/admin/login/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok && data.token) {
        if (data.is_admin) {
          setAuthToken(data.token);
          router.push('/dashboard');
        } else {
          setError('Admin privileges required');
        }
      } else {
        setError(
          data.non_field_errors?.[0] ||
          data.error ||
          'Login failed'
        );
      }
    } catch (err) {
      setError('An error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          className="mt-1 px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          className="mt-1 px-3 py-2 border rounded-md"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

## Example 7: Error Handling Component

```typescript
// components/ProtectedPageWrapper.tsx
'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

interface Props {
  children: ReactNode;
}

export default function ProtectedPageWrapper({ children }: Props) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.push('/');
      return;
    }

    // Optional: Validate token with backend
    validateToken(token)
      .then((isValid) => {
        if (isValid) {
          setIsAuthenticated(true);
        } else {
          router.push('/');
        }
      })
      .catch(() => {
        router.push('/');
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/validate/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
        },
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}
```

## Example 8: Complete Admin Page Template

```typescript
// src/app/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, logout } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { LogOut } from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/`,
        {
          headers: {
            'Authorization': `Token ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load users'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <main className="flex-1 p-8 bg-slate-800 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {loading && <p className="text-white">Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Admin</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-600">
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">
                      {user.is_admin ? '✓' : '✗'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
```

---

These examples demonstrate various ways to integrate and use the authentication system in your admin dashboard application.
