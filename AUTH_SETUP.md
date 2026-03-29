# Authentication Setup Guide

This project is structured for Supabase authentication. The structure is ready, and you just need to integrate Supabase when ready.

## 📁 Project Structure

```
app/
├── (auth)/                    # Auth route group - has its own layout
│   ├── layout.js             # Auth-specific layout (centered, clean)
│   ├── login/
│   │   └── page.js           # Login page with email auth
│   └── signup/
│       └── page.js           # Signup page
│
├── (main)/                    # Main app route group
│   ├── layout.js             # Main app layout
│   └── demo/
│       └── page.js           # Theme demo page
│
├── layout.js                 # Root layout (theme provider, fonts)
└── page.js                   # Landing page

lib/
├── supabase/
│   ├── client.js             # Client-side Supabase client
│   ├── server.js             # Server-side Supabase client
│   └── middleware.js         # Middleware for session management
└── auth/
    └── actions.js            # Server actions for auth operations
```

## 🎯 Why This Structure?

### Route Groups `(auth)` and `(main)`
- **Organized**: Keeps auth pages separate from main app pages
- **Different Layouts**: Auth pages have a centered layout, main app can have sidebar/nav
- **No URL Impact**: `(auth)/login` becomes `/login` (parentheses are ignored in URLs)
- **Scalable**: Easy to add more auth pages (reset-password, verify-email, etc.)

### Supabase Helper Files
- **client.js**: For client components (useState, useEffect, etc.)
- **server.js**: For server components, API routes, server actions
- **middleware.js**: Refreshes auth session on every request
- **actions.js**: Centralized auth operations (sign in, sign up, sign out)

## 🚀 Current State

✅ **What's Ready:**
- Complete UI for login and signup pages
- Proper folder structure
- Helper files with TODO comments
- Email-only authentication UI
- OAuth buttons (Google, GitHub) ready for integration

🔄 **What's Placeholder:**
- Auth actions return mock responses
- Supabase clients return null
- OAuth buttons show "not implemented" message

## 🔧 Supabase Integration Steps

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Set Up Environment Variables
Create `.env.local` in the root:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Uncomment Code in Helper Files
- `lib/supabase/client.js` - Uncomment the createBrowserClient code
- `lib/supabase/server.js` - Uncomment the createServerClient code
- `lib/auth/actions.js` - Uncomment the auth functions

### 4. Create Middleware (Optional but Recommended)
Create `middleware.js` in the root:
```javascript
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 5. Create Auth Callback Route
Create `app/auth/callback/route.js`:
```javascript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
```

### 6. Update Auth Pages
Replace the placeholder `handleSubmit` in login/signup pages with:
```javascript
import { signInWithEmail } from '@/lib/auth/actions'

const handleSubmit = async (e) => {
  e.preventDefault()
  setIsLoading(true)
  
  const result = await signInWithEmail(email)
  
  if (result.error) {
    setMessage(result.error)
  } else {
    setMessage(result.message)
  }
  
  setIsLoading(false)
}
```

## 🎨 Pages Available

- `/` - Landing page with CTA buttons
- `/login` - Email-only login with magic link
- `/signup` - Email-only signup
- `/demo` - Theme showcase (all shadcn components)

## 🔐 Authentication Flow

### Magic Link (Email-Only)
1. User enters email
2. Supabase sends magic link to email
3. User clicks link → redirected to `/auth/callback`
4. Callback exchanges code for session
5. User redirected to main app

### OAuth (Google, GitHub)
1. User clicks provider button
2. Redirected to OAuth provider
3. After approval → redirected to `/auth/callback`
4. Callback exchanges code for session
5. User redirected to main app

## 📝 Next Steps

1. **Set up Supabase project** at https://supabase.com
2. **Enable Email Auth** in Supabase Dashboard → Authentication → Providers
3. **Configure Email Templates** (optional but recommended)
4. **Enable OAuth Providers** if needed (Google, GitHub, etc.)
5. **Uncomment code** in helper files
6. **Test authentication** flow
7. **Add protected routes** in middleware
8. **Create user dashboard/profile pages**

## 🎯 Benefits of This Setup

- ✅ **Type-safe**: Ready for TypeScript if needed
- ✅ **Server Components**: Leverages Next.js 14+ features
- ✅ **Secure**: Server-side session management
- ✅ **Scalable**: Easy to add new auth methods
- ✅ **Clean**: Separation of concerns
- ✅ **Production-ready**: Follows Supabase best practices

## 🐛 Troubleshooting

### "Cookie header too large"
- Add middleware to refresh sessions properly
- Limit the number of cookies set

### "User is null"
- Check if middleware is running
- Verify environment variables
- Check Supabase dashboard for user

### "Redirect loop"
- Make sure login/signup pages are excluded from auth middleware
- Check redirect logic in middleware

## 📚 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js 14+ with Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase SSR Package](https://github.com/supabase/ssr)

