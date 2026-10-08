<<<<<<< HEAD
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="/artifacts/qa/admin-dashboard.png" />
</div>

# PayFollows SMM Panel

A modern Social Media Marketing (SMM) reseller panel built with React, TypeScript, Supabase, and FastPay integration.

## Features

- Secure user authentication with Supabase
- FastPay payment processing and balance top-ups
- Dashboard with order and account statistics
- Order creation and tracking
- Admin panel for managing users, services, and orders
- Modern dark-themed UI with purple accents

## Prerequisites

- Node.js 18 or higher
- A Supabase project
- A FastPay merchant account for payments

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at Supabase.
2. Open Settings → API and copy the Project URL and anon key.
3. Run the SQL schema from [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor.

### 3. Configure environment variables

Create a root-level .env.local file:

```env
# Frontend / Vite
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FASTPAY_MERCHANT_ID=your_fastpay_merchant_id
VITE_FASTPAY_BASE_URL=https://api.fastpay.com/v1
```

For server-side secrets, create [server/.env.local](server/.env.local) (do not commit this file):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FASTPAY_API_KEY=your_fastpay_private_key
FASTPAY_WEBHOOK_SECRET=your_fastpay_webhook_secret
```

### 4. Create your first admin user

After signing up through the registration page:

- Option A: Set the role in Supabase directly in the user_profiles table.
- Option B: Use the helper script:

```bash
npm run create-admin -- some.admin@example.com StrongP@ssw0rd adminuser
```

If the admin login still reports that the user is not an admin, sign out and sign in again so the latest profile role is refreshed.

### 5. Run the application

```bash
npm run dev
```

The app will be available at http://localhost:3000.

## Environment Variable Notes

### Client-safe Vite variables

These are safe to expose to the frontend:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_FASTPAY_MERCHANT_ID
- VITE_FASTPAY_BASE_URL

### Server-only secrets

Keep these on the server and never expose them in client-visible Vite variables:

- SUPABASE_SERVICE_ROLE_KEY
- FASTPAY_API_KEY
- FASTPAY_WEBHOOK_SECRET
- Other private API keys such as GEMINI_API_KEY or AZURE_AD_CLIENT_SECRET

If you previously used VITE_FASTPAY_SECRET_KEY or VITE_FASTPAY_WEBHOOK_SECRET in your local env file, move them to server/.env.local as FASTPAY_API_KEY and FASTPAY_WEBHOOK_SECRET.

## Production / Deployment

To deploy a single server that serves both the frontend and backend API:

1. Build the frontend:

```bash
npm run build
```

2. Start the server in production mode:

```bash
SERVE_STATIC=1 NODE_ENV=production npm start
```

If you prefer to host the frontend and API separately, deploy the dist/ output to a static host and run the API server separately.

## Database Schema

The application uses the following core tables:

- user_profiles
- services
- orders
- payments
- providers
- payment_logs

See [supabase/schema.sql](supabase/schema.sql) for the full schema and RLS policies.

## Project Structure

```text
src/
  components/
  lib/
  pages/
server/
supabase/
```

## Security

- Row Level Security (RLS) is enabled on the main tables.
- Users can only access their own records unless they have elevated permissions.
- Admins should keep service role keys private and rotate them immediately if exposed.

### Rotating a leaked service role key

If a service role key or other secret is exposed in the repository:

1. Rotate the key in the Supabase console immediately.
2. Update all deployment environment variables with the new value.
3. Remove the secret from the repository history if necessary.

## Development Commands

```bash
npm run dev
npm run build
npm run preview
```

## License

This project is private and proprietary.

## Support

For issues and questions, contact the development team.
=======
# payfollows
>>>>>>> e989aa117435384ed96703c4a157634c877ba2ba
