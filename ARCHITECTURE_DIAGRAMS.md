# Admin Authentication System - Visual Diagrams

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Login Page      │         │  Dashboard Page  │             │
│  │  (src/app/...)   │         │  (Protected)     │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                            │                       │
│           │                            │                       │
│  ┌────────▼────────────────────────────▼──────────┐            │
│  │     localStorage                                │            │
│  │     {token: "abc123..."}                       │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │ Authorization: Token abc123...
                            │
                ┌───────────▼───────────┐
                │   Backend API         │
                │ - Validate Token      │
                │ - Check is_admin      │
                │ - Return Data         │
                └───────────────────────┘
```

## 2. Login Flow Diagram

```
START
  │
  ▼
┌─────────────────────┐
│  Login Page Loads   │
│  (src/app/page.tsx) │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ User enters: │
    │ • Email      │
    │ • Password   │
    └──────┬───────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Click "Sign In" Button      │
    │ handleSubmit()              │
    └──────────┬──────────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ POST Request to:     │
        │ /api/auth/admin/     │
        │ login/               │
        └──────────┬───────────┘
                   │
                   ▼
         ┌──────────────────────────────┐
         │  Backend validates:          │
         │  1. Credentials correct?     │
         │  2. User exists?             │
         │  3. user.is_admin == true?   │
         └──────────┬─────────┬────┬────┘
                    │         │    │
         ┌──────────▼┐   ┌───▼──┐ │
         │ Valid     │   │Error │ │
         └──────┬────┘   └──┬───┘ │
                │           │     │
         ┌──────▼────────┐  │     │
         │ Return token  │  │     │
         │ is_admin:true │  │     │
         └──────┬────────┘  │     │
                │           │     │
         ┌──────▼────────────▼─────▼──────┐
         │  Frontend processes response   │
         └──────┬──────────┬──────────┬───┘
                │          │          │
         ┌──────▼──┐ ┌─────▼─────┐ ┌─▼──────────┐
         │ Valid   │ │ 403 Error │ │ 400 Error  │
         │ Token   │ │ Not Admin │ │ Bad Creds  │
         └──────┬──┘ └─────┬─────┘ └─┬──────────┘
                │          │         │
         ┌──────▼──────┐   │         │
         │ Save token  │   │         │
         │ in          │   │         │
         │ localStorage│   │         │
         └──────┬──────┘   │         │
                │          │         │
         ┌──────▼──────────▼─────────▼───────┐
         │  Show error messages to user      │
         └──────┬──────────────────────┬─────┘
                │                      │
         ┌──────▼──────┐        ┌──────▼───────┐
         │  Redirect   │        │  Stay on     │
         │  to         │        │  login page  │
         │  /dashboard │        │  Show error  │
         └─────────────┘        └──────────────┘
                │                      │
                ▼                      ▼
               END                    RETRY
```

## 3. Protected Route Access Flow

```
User requests /dashboard
         │
         ▼
    ┌──────────────────────────┐
    │ Dashboard Component      │
    │ Mounts                   │
    └──────────┬───────────────┘
               │
               ▼
        ┌────────────────────────┐
        │ useEffect checks:      │
        │ getAuthToken()         │
        └──────────┬──────┬──────┘
                   │      │
            ┌──────▼┐  ┌──▼──────┐
            │Token  │  │ No      │
            │Found  │  │ Token   │
            └───┬───┘  └───┬─────┘
                │          │
         ┌──────▼─┐   ┌────▼──────────┐
         │ Load   │   │ Redirect to   │
         │ Data   │   │ Login Page    │
         │ with   │   │ (/)           │
         │ Auth   │   └───────────────┘
         └───┬────┘
             │
         ┌───▼──────────────────┐
         │ Fetch Dashboard Data │
         │ Header:              │
         │ Authorization:       │
         │ Token <token>        │
         └───┬──────────┬───────┘
             │          │
        ┌────▼──┐   ┌───▼────┐
        │ 200   │   │ 401    │
        │ OK    │   │ Invalid│
        │ Data  │   │ Token  │
        └───┬───┘   └───┬────┘
            │           │
    ┌───────▼─────┐  ┌──▼──────────┐
    │  Display    │  │  Call       │
    │  Dashboard  │  │  logout()   │
    │             │  │  Redirect   │
    │             │  │  to Login   │
    └─────────────┘  └─────────────┘
```

## 4. Logout Flow

```
User clicks "Logout" button
              │
              ▼
         ┌─────────────┐
         │ Call        │
         │ logout()    │
         │ from        │
         │ @/lib/auth  │
         └──────┬──────┘
                │
        ┌───────▼────────┐
        │ removeAuthToken│
        │ ();            │
        │ Clears token   │
        │ from           │
        │ localStorage   │
        └──────┬─────────┘
               │
        ┌──────▼────────────┐
        │ window.location    │
        │ .href = '/'        │
        │ Redirect to login  │
        └─────────────────────┘
               │
               ▼
        ┌──────────────┐
        │  Login Page  │
        │  Ready for   │
        │  new login   │
        └──────────────┘
```

## 5. Component Dependency Tree

```
Root Application
    │
    ├─── src/app/page.tsx (Login)
    │    ├─── setAuthToken() from @/lib/auth
    │    ├─── getAuthToken() from @/lib/auth
    │    ├─── Framer Motion
    │    └─── Next Router
    │
    ├─── src/app/dashboard/page.tsx (Protected)
    │    ├─── ProtectedRoute (optional wrapper)
    │    ├─── Sidebar Component
    │    ├─── getAuthToken() from @/lib/auth
    │    ├─── logout() from @/lib/auth
    │    ├─── useRouter from next/navigation
    │    ├─── Recharts (for data visualization)
    │    └─── Lucide Icons
    │
    ├─── src/components/ProtectedRoute.tsx
    │    ├─── getAuthToken() from @/lib/auth
    │    ├─── useRouter from next/navigation
    │    └─── React hooks (useState, useEffect)
    │
    ├─── src/components/Sidebar.tsx
    │    ├─── logout() from @/lib/auth
    │    ├─── Lucide Icons
    │    └─── Framer Motion
    │
    ├─── src/lib/auth.ts
    │    └─── localStorage API
    │
    └─── middleware.ts
         └─── Next.js Request/Response
```

## 6. Token Flow Through Components

```
┌──────────────────────────────────────────────────────────┐
│                    Browser Storage                        │
│                 localStorage: {token}                     │
└──────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │ setAuthToken()     │ getAuthToken()     │
         │                    │                    │ removeAuthToken()
         │                    │                    │
    ┌────┴─────────┬──────────┴────────┬───────────┴────┐
    │              │                   │                │
    │              │                   │                │
┌───▼──────┐  ┌───▼──────┐  ┌────────▼──┐  ┌──────────▼──┐
│ Login    │  │Dashboard │  │Protected  │  │ Sidebar    │
│ Page     │  │ Page     │  │ Route     │  │ Component  │
│          │  │          │  │           │  │            │
└──────────┘  └──────────┘  └───────────┘  └────────────┘
```

## 7. API Request/Response Cycle

```
┌─────────────────────────────────────┐
│        Frontend (Browser)            │
│                                      │
│  const token = getAuthToken();       │
│  const response = fetch(             │
│    '/api/endpoint/',                 │
│    {                                 │
│      headers: {                      │
│        'Authorization':              │
│        `Token ${token}`              │
│      }                               │
│    }                                 │
│  );                                  │
└─────────────┬───────────────────────┘
              │
              │ HTTP Request
              │ Header: Authorization: Token abc123...
              │
    ┌─────────▼──────────────┐
    │  Backend API Server    │
    │                        │
    │ 1. Extract token from  │
    │    Authorization       │
    │    header              │
    │                        │
    │ 2. Validate token      │
    │                        │
    │ 3. Check user.is_admin │
    │                        │
    │ 4. Execute request     │
    │                        │
    │ 5. Return JSON         │
    │    response            │
    └─────────┬──────────────┘
              │
              │ HTTP Response (200, 403, 401, 500)
              │ JSON: { data: {...} }
              │
┌─────────────▼──────────────────────────┐
│      Frontend (Browser)                 │
│                                        │
│  if (response.ok) {                    │
│    const data = response.json();       │
│    // Update UI with data              │
│  } else if (response.status === 401) { │
│    logout(); // Token invalid          │
│  }                                     │
└────────────────────────────────────────┘
```

## 8. Error Handling Flow

```
User attempts login
       │
       ▼
┌─────────────────────────┐
│ handleSubmit() throws   │
│ try/catch              │
└────────┬────────────────┘
         │
    ┌────▼───────────────────┐
    │ Check response.ok       │
    │ and response.status     │
    └────┬────┬────┬────┬────┘
         │    │    │    │
    ┌────▼──┐ │    │    │
    │ 200   │ │    │    │
    │ OK    │ │    │    │
    └─┬─────┘ │    │    │
      │ ┌─────▼──┐ │    │
      │ │ 400    │ │    │
      │ │ Bad    │ │    │
      │ │ Creds  │ │    │
      │ └─┬──────┘ │    │
      │   │ ┌──────▼──┐ │
      │   │ │ 403     │ │
      │   │ │ Not     │ │
      │   │ │ Admin   │ │
      │   │ └─┬───────┘ │
      │   │   │ ┌───────▼──┐
      │   │   │ │ 500      │
      │   │   │ │ Server   │
      │   │   │ │ Error    │
      │   │   │ └──┬───────┘
      │   │   │    │
    ┌─▼───▼───▼───▼───────────────┐
    │ Set appropriate error        │
    │ message                      │
    └──────┬──────────────────────┘
           │
    ┌──────▼────────────────────┐
    │ Display error on page     │
    │ "Admin privileges         │
    │  required"                │
    │  or                       │
    │ "Unable to log in with    │
    │  provided credentials."   │
    └───────────────────────────┘
```

---

These diagrams provide a visual understanding of the authentication system's architecture and flows. Each diagram shows different aspects of how the system works together.
