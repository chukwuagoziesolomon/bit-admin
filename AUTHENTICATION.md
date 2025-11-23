# Admin Authentication Implementation

## Overview
This document describes the admin authentication system implemented for the Bit Admin Dashboard. The system ensures that only admin users can access the dashboard after successful login with their credentials.

## Architecture

### Components

#### 1. **Authentication Library** (`src/lib/auth.ts`)
Provides utility functions for token management:
- `getAuthToken()` - Retrieves token from localStorage
- `setAuthToken(token)` - Stores token in localStorage
- `removeAuthToken()` - Clears token from localStorage
- `isAuthenticated()` - Checks if user is logged in
- `logout()` - Logs out user and redirects to login page

#### 2. **Login Page** (`src/app/page.tsx`)
- Client-side login form with email and password fields
- Sends credentials to `/api/auth/admin/login/` endpoint
- Validates `is_admin` flag in response
- Stores authentication token on successful login
- Displays error messages for failed login attempts:
  - Invalid credentials (400)
  - Admin privileges required (403)
  - Server errors (500)

#### 3. **Protected Route Component** (`src/components/ProtectedRoute.tsx`)
- Wrapper component for protecting pages
- Checks for valid token on mount
- Shows loading spinner while authenticating
- Redirects to login if token is missing

#### 4. **Dashboard Protection** (`src/app/dashboard/page.tsx`)
- Checks authentication status on component mount
- Redirects unauthenticated users to login page
- Displays loading state while verifying credentials
- Includes logout button in top-right corner
- All dashboard data fetches include Authorization header with token

#### 5. **Sidebar Component** (`src/components/Sidebar.tsx`)
- Updated logout button using `logout()` helper
- Logs out user and redirects to login page

#### 6. **Middleware** (`middleware.ts`)
- Server-side route protection
- Validates token for all protected routes
- Redirects to login for unauthenticated requests

## API Endpoints

### Admin Login
```
POST /api/auth/admin/login/
```

**Request:**
```json
{
  "email": "admin@bitgadgetz.com",
  "password": "SecurePass2024!"
}
```

**Success Response (200):**
```json
{
  "token": "token123abc...",
  "is_admin": true,
  "user": {
    "id": 1,
    "email": "admin@bitgadgetz.com",
    "name": "Admin User"
  }
}
```

**Error Responses:**

1. **Invalid Credentials (400)**
```json
{
  "non_field_errors": ["Unable to log in with provided credentials."]
}
```

2. **Not Admin (403)**
```json
{
  "error": "Admin privileges required"
}
```

3. **Server Error (500)**
```json
{
  "error": "An error occurred during login"
}
```

## Authentication Flow

### Login Flow
1. User enters email and password
2. Frontend sends POST request to `/api/auth/admin/login/`
3. Backend validates credentials and checks `is_admin` flag
4. If valid, backend returns token
5. Frontend stores token in localStorage using `setAuthToken()`
6. User is redirected to `/dashboard`

### Dashboard Access Flow
1. Dashboard page mounts
2. Component checks for token using `getAuthToken()`
3. If token exists:
   - Fetch dashboard data with `Authorization: Token <token>` header
   - Display dashboard
4. If token missing:
   - Redirect to login page

### Logout Flow
1. User clicks logout button
2. Call `logout()` function
3. Token is removed from localStorage
4. User is redirected to login page

## Token Management

### Storage
- Tokens are stored in browser `localStorage` under key `'token'`
- Tokens persist across page refreshes
- Tokens are cleared on logout

### Sending Tokens
All API requests to protected endpoints must include:
```
Authorization: Token <token_value>
```

Example in fetch:
```typescript
const token = getAuthToken();
fetch('/api/protected-endpoint/', {
  headers: {
    'Authorization': `Token ${token}`
  }
})
```

## Security Features

1. **Client-side Token Validation** - Checks for token before rendering protected pages
2. **Server-side Middleware** - Validates token on server for all protected routes
3. **Admin Flag Check** - Ensures user has `is_admin=true`
4. **Error Handling** - Displays specific error messages for different failure scenarios
5. **Token Expiration** - Backend should implement token expiration (implement on API side)

## Usage Guide

### Protecting a New Page

1. Wrap the component with `ProtectedRoute`:
```typescript
import ProtectedRoute from '@/components/ProtectedRoute';

export default function NewPage() {
  return (
    <ProtectedRoute>
      <YourPageContent />
    </ProtectedRoute>
  );
}
```

2. Or add manual authentication check:
```typescript
'use client';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

export default function Page() {
  const router = useRouter();
  
  useEffect(() => {
    if (!getAuthToken()) {
      router.push('/');
    }
  }, [router]);
  
  // Rest of component
}
```

### Using Token in API Calls

```typescript
import { getAuthToken } from '@/lib/auth';

const token = getAuthToken();
const response = await fetch('/api/protected-endpoint/', {
  headers: {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Testing

### Test Credentials
- Email: `admin@bitgadgetz.com`
- Password: `SecurePass2024!`

### Test Scenarios

1. **Valid Admin Login**
   - Enter test credentials
   - Should redirect to dashboard

2. **Invalid Credentials**
   - Enter wrong password
   - Should show error: "Unable to log in with provided credentials."

3. **Non-Admin User**
   - Login with non-admin account
   - Should show error: "Admin privileges required"

4. **Logout**
   - Click logout button
   - Should redirect to login page

5. **Access Dashboard Without Token**
   - Clear localStorage token manually
   - Refresh dashboard page
   - Should redirect to login

## Environment Variables

Ensure `.env.local` contains:
```
NEXT_PUBLIC_API_BASE_URL=http://your-api-url
```

## Future Enhancements

1. **Refresh Token** - Implement refresh token mechanism for extended sessions
2. **Remember Me** - Add option to remember user for longer periods
3. **Two-Factor Authentication** - Add 2FA for enhanced security
4. **Token Expiration Handling** - Automatically refresh expired tokens
5. **Session Management** - Track active sessions and allow termination
6. **Role-Based Access Control** - Different permission levels for different admin roles

## Troubleshooting

### User stuck on login page
- Check if `NEXT_PUBLIC_API_BASE_URL` is correct
- Verify backend API is running
- Check browser console for errors

### Token not persisting
- Check localStorage is enabled in browser
- Verify `setAuthToken()` is called after login

### 403 Forbidden errors
- Verify `is_admin` flag is true for the user account
- Check token hasn't expired on backend
- Verify token format in Authorization header

### CORS errors
- Check backend CORS configuration
- Verify API endpoint is accessible
- Check Content-Type headers are correct
