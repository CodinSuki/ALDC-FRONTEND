# Admin Authentication System

## Overview

A protected authentication system has been implemented for the admin panel. All admin routes (`/admin/*`) now require login. If a user tries to access any admin route without being authenticated, they will be redirected to `/admin/login`.

## Features

✅ **Protected Routes** - All admin routes require authentication
✅ **Login Page** - Professional login interface at `/admin/login`
✅ **Session Persistence** - Login state persists across browser refreshes using localStorage
✅ **Logout Functionality** - Logout button in the admin sidebar
✅ **Auto-Redirect** - Unauthenticated users are redirected to login
✅ **Loading State** - Loading spinner while checking authentication status

## How It Works

### 1. **AuthContext** (`src/app/context/AuthContext.tsx`)
- Manages authentication state globally using React Context
- Provides `useAuth()` hook to access auth functions
- Stores authentication data in browser's localStorage
- Handles login and logout operations

### 2. **ProtectedRoute** (`src/app/components/ProtectedRoute.tsx`)
- Wrapper component that guards admin routes
- Redirects unauthenticated users to `/admin/login`
- Shows loading spinner while checking auth status

### 3. **Login Page** (`src/app/pages/admin/Login.tsx`)
- Professional login form with email and password fields
- Form validation (email format, password minimum 6 characters)
- Error handling and user feedback
- Redirects to dashboard on successful login

### 4. **Admin Layout** (`src/app/components/AdminLayout.tsx`)
- Added logout button in the user info section
- Logout removes session and redirects to login page

## Usage

### Protected Admin Routes
All admin routes are now protected:
```
/admin/dashboard
/admin/projects
/admin/properties
/admin/clients
/admin/inquiries
/admin/transactions
/admin/agents
/admin/reports
/admin/settings
/admin/commissions
```

### Public Routes
Public routes remain unchanged and accessible without login:
```
/
/about
/team
/resources
/contact
/faqs
/properties
/property/:id
/property/:id/inquire
/consultation
/sell
```

### Login Route
New unprotected login route:
```
/admin/login
```

## Authentication Flow

1. User visits `/admin/dashboard` or any admin route
2. If not authenticated, `ProtectedRoute` redirects to `/admin/login`
3. User enters email and password
4. On successful login, authentication state is saved
5. User is redirected to the dashboard
6. Login persists until user clicks logout or clears localStorage

## Demo Credentials

Currently set to **demo mode**. Any email and password (minimum 6 characters) will work:
- **Email:** any email
- **Password:** any password (min 6 characters)

## Integration with Backend

To connect to your actual authentication backend:

1. Open `src/app/context/AuthContext.tsx`
2. Update the `login()` function to call your backend API:

```typescript
const login = async (email: string, password: string): Promise<void> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  const data = await response.json();
  localStorage.setItem('adminAuth', JSON.stringify(data)); // Store token
  setIsAuthenticated(true);
};
```

## Security Notes

⚠️ **Important for Production:**
- Replace demo authentication with real API calls
- Use JWT tokens instead of storing email
- Add token expiration/refresh logic
- Use HTTP-only cookies for tokens (if possible with your backend)
- Implement CSRF protection
- Add rate limiting to login endpoint

## Files Created/Modified

**New Files:**
- `src/app/context/AuthContext.tsx` - Authentication context
- `src/app/components/ProtectedRoute.tsx` - Route protection wrapper
- `src/app/pages/admin/Login.tsx` - Login page

**Modified Files:**
- `src/app/App.tsx` - Added AuthProvider and ProtectedRoute wrappers
- `src/app/components/AdminLayout.tsx` - Added logout button
