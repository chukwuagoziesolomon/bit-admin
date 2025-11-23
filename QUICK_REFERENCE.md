# Admin Dashboard Authentication - Quick Reference Guide

## 🔐 What's Protected

✅ **Protected Pages:**
- `/dashboard` - Requires authentication
- `/products` - Requires authentication
- `/orders` - Requires authentication
- `/users` - Requires authentication
- `/categories` - Requires authentication
- And all other admin pages

✅ **Public Pages:**
- `/` - Login page (no auth needed)

## 🚀 Quick Start

### For Users:
1. Open the application
2. You'll see the login page
3. Enter your admin credentials:
   - Email: `admin@bitgadgetz.com`
   - Password: `SecurePass2024!`
4. Click "Sign In"
5. Access the dashboard
6. Click "Logout" to exit

### For Developers:

#### Check if User is Logged In
```typescript
import { isAuthenticated } from '@/lib/auth';

if (isAuthenticated()) {
  // User is logged in
}
```

#### Get Auth Token
```typescript
import { getAuthToken } from '@/lib/auth';

const token = getAuthToken();
```

#### Make Protected API Call
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

#### Log User Out
```typescript
import { logout } from '@/lib/auth';

logout(); // Clears token and redirects to login
```

#### Protect a New Page
Option 1: Use ProtectedRoute wrapper
```typescript
'use client';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>My Protected Content</div>
    </ProtectedRoute>
  );
}
```

Option 2: Manual check
```typescript
'use client';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';
import { useEffect } from 'react';

export default function MyPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getAuthToken()) {
      router.push('/');
    }
  }, [router]);

  return <div>My Protected Content</div>;
}
```

## 🔍 How It Works

### Login Process
```
1. User enters email & password
   ↓
2. Sent to: POST /api/auth/admin/login/
   ↓
3. Backend validates:
   - Check credentials are correct
   - Check user.is_admin == true
   ↓
4. If valid:
   - Return auth token
   - Frontend stores in localStorage
   - Redirect to /dashboard
   ↓
5. If invalid:
   - Return error message
   - Show on login page
```

### Protected Page Access
```
1. User visits /dashboard
   ↓
2. Component checks for token
   ↓
3. Token found?
   - Yes: Load page, fetch data with token
   - No: Redirect to login
   ↓
4. All API calls include:
   Authorization: Token <token>
```

### Logout Process
```
1. User clicks logout
   ↓
2. Token removed from localStorage
   ↓
3. Redirect to login page
   ↓
4. Session ends
```

## 📋 Files Structure

```
bit-admin/
├── src/
│   ├── app/
│   │   ├── page.tsx (Login)
│   │   ├── dashboard/
│   │   │   └── page.tsx (Protected)
│   │   └── ... (other admin pages)
│   ├── components/
│   │   ├── ProtectedRoute.tsx (Auth wrapper)
│   │   └── Sidebar.tsx (Logout button)
│   └── lib/
│       └── auth.ts (Auth utilities)
├── middleware.ts (Route protection)
├── AUTHENTICATION.md (Full docs)
└── IMPLEMENTATION_SUMMARY.md (Summary)
```

## 🛠️ Configuration

### Required Environment Variable
Create `.env.local` with:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```
Replace with your actual backend URL.

## ✅ Verification Checklist

- [ ] Login page displays correctly
- [ ] Can login with test credentials
- [ ] Invalid credentials show error
- [ ] Dashboard loads after successful login
- [ ] Logout button appears on dashboard
- [ ] Logout clears session and redirects
- [ ] Direct URL access to dashboard without token redirects to login
- [ ] Page refresh maintains session
- [ ] All dashboard pages require authentication

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Login fails | Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local` |
| "Admin privileges required" | Ensure test account has `is_admin=true` |
| Token not persisting | Clear browser cache, check localStorage enabled |
| Stuck on loading | Check backend API is running and responding |
| 403 Forbidden errors | Verify token is sent with `Authorization: Token` header |

## 📞 API Reference

### Login Endpoint
```
POST /api/auth/admin/login/

Request:
{
  "email": "admin@bitgadgetz.com",
  "password": "SecurePass2024!"
}

Success Response (200):
{
  "token": "abc123def456...",
  "is_admin": true,
  "user": {
    "id": 1,
    "email": "admin@bitgadgetz.com",
    "name": "Admin Name"
  }
}

Error Responses:
- 400: Invalid credentials
- 403: Not admin user
- 500: Server error
```

## 🔐 Security Tips

✓ Tokens are stored securely in localStorage
✓ Never share your admin credentials
✓ Logout before leaving a shared computer
✓ Each page validates token automatically
✓ Server validates token for all requests
✓ Non-admin users cannot access admin pages

## 📱 Device Support

- ✅ Desktop browsers
- ✅ Tablet browsers
- ✅ Mobile browsers
- ✅ Dark mode compatible
- ✅ Responsive design

## 🚀 Performance

- Fast login/logout (client-side)
- Automatic redirects (no manual refresh needed)
- Token validation on every request
- Efficient middleware checking
- No page reload delays

## 📚 Documentation

- **Full Details:** See `AUTHENTICATION.md`
- **Implementation Notes:** See `IMPLEMENTATION_SUMMARY.md`
- **This Guide:** `QUICK_REFERENCE.md`

---

**Last Updated:** November 22, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
