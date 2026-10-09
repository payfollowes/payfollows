# PayFollows

A secure SMM reseller panel built with React, TypeScript, Vite, Node.js, Express, and Supabase.

## Quick start

1. Install dependencies:
   npm install
2. Copy the example env files and fill in real values:
   cp .env.example .env.local
   cp server/.env.example server/.env.local
3. Apply the Supabase schema in the Supabase SQL editor.
4. Start the app:
   npm run dev

## Security notes

- Keep server-only secrets in server/.env.local or your deployment platform environment.
- Do not commit production credentials or service-role keys.
- Client bundles must only receive public Supabase keys.
- Payment and provider webhooks must be verified before processing.

## Scripts

- npm run dev
- npm run build
- npm run test
- npm run start:server

## Project structure

- src/
- server/
- supabase/
- docs/remediation/

## Deployment

Use the Vercel config in vercel.json and set environment variables in deployment settings rather than checking them into the repository.
