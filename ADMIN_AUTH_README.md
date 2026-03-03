# Admin Authentication System

## Overview

A protected authentication system is implemented for the admin panel. All admin routes (`/admin/*`) require login, and privileged Supabase operations now run on server-side API routes.

## Features

✅ **Protected Routes** - All admin routes require authentication
✅ **Login Page** - Professional login interface at `/admin/login`
✅ **Server Session** - Login state is stored in an HTTP-only cookie
✅ **Logout Functionality** - Logout button in the admin sidebar
✅ **Auto-Redirect** - Unauthenticated users are redirected to login
✅ **Loading State** - Loading spinner while checking authentication status
✅ **Privileged API Protection** - Seller submission admin operations run through protected server endpoints

## How It Works

### 1. **AuthContext** (`src/app/context/AuthContext.tsx`)
- Manages authentication state globally using React Context
- Provides `useAuth()` hook to access auth functions
- Calls `/api/admin/login`, `/api/admin/session`, and `/api/admin/logout`
- Sends requests with `credentials: 'include'` so session cookies are used

### 2. **ProtectedRoute** (`src/app/components/ProtectedRoute.tsx`)
- Wrapper component that guards admin routes
- Redirects unauthenticated users to `/admin/login`
- Shows loading spinner while checking auth status

### 3. **Login Page** (`src/app/pages/admin/Login.tsx`)
- Professional login form with email and password fields
- Form validation and backend credential verification
- Error handling and user feedback
- Redirects to dashboard on successful login

### 4. **Admin Layout** (`src/app/components/AdminLayout.tsx`)
- Added logout button in the user info section
- Logout removes session and redirects to login page

### 5. **Server Admin Auth APIs** (`api/admin/*`)
- `POST /api/admin/login`: verifies `ADMIN_EMAIL` + `ADMIN_PASSWORD`, then sets HTTP-only session cookie
- `GET /api/admin/session`: checks whether an admin session cookie is valid
- `POST /api/admin/logout`: clears session cookie

### 6. **Protected Seller Submission API** (`api/admin/seller-submissions.ts`)
- Uses `SUPABASE_SERVICE_ROLE_KEY` on server only
- Requires valid admin session cookie
- Handles list/detail/status update/delete operations that were previously browser-side Supabase calls

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
4. On successful login, server issues an HTTP-only cookie session
5. User is redirected to the dashboard
6. Login persists until cookie expires or user logs out

## Environment Variables

Set these in your deployment environment (e.g. Vercel Environment Variables):

- `SUPABASE_URL` (or fallback `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

## Security Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only (never `VITE_*`).
- Keep `ADMIN_SESSION_SECRET` long and random.
- Rotate credentials immediately if leaked.
- Consider adding rate limiting on `POST /api/admin/login`.

## Files Added

- `api/admin/_utils/auth.ts`
- `api/admin/_utils/supabaseAdmin.ts`
- `api/admin/login.ts`
- `api/admin/logout.ts`
- `api/admin/session.ts`
- `api/admin/seller-submissions.ts`

## Files Updated

- `src/app/context/AuthContext.tsx`
- `src/app/services/sellerSubmissionsService.ts`
- `src/app/pages/admin/Login.tsx`
