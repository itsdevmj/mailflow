<div align="center">
  <img src="public/mailflow-logo.svg" alt="Mailflow logo" width="88" />
  <h1>Mailflow</h1>
  <p>A modern, self-hosted email client powered by Resend.</p>
</div>

Mailflow is a self-hosted Resend inbox and email client built with Next.js. It provides a polished webmail experience for receiving, reading, organizing, and sending email from your own domain.

## Features

- Send and receive email through the Resend API
- Render responsive HTML emails in an adaptive dark reader
- Persistent read/unread state, stars, folders, labels, and drafts
- Inbox, Unread, Starred, Sent, Archive, Spam, and Trash views
- Cursor-based pagination and page-level search
- Shareable folder and message URLs
- Secure single-admin authentication
- Responsive desktop and mobile interface
- Production-ready deployment on Vercel

## Stack

- Next.js 16, React 19, and TypeScript
- Resend Sending and Receiving APIs
- PostgreSQL with Prisma
- Neon or Vercel Postgres
- Vercel hosting

## Quick start

Requirements: Node.js 20+, a Resend account with a receiving domain, and a PostgreSQL database.

```bash
npm install
cp .env.example .env.local
npm run auth:hash -- "your-password"
npm run db:deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

```env
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=Mailflow <mail@your-verified-domain.com>
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$12$replace_with_bcrypt_hash
AUTH_SECRET=replace_with_a_long_random_secret
```

Generate `ADMIN_PASSWORD_HASH` with `npm run auth:hash -- "your-password"`. Use a long random value for `AUTH_SECRET`.

## Configure Resend

1. Verify a sending domain in Resend.
2. Configure the domain's MX record for inbound email.
3. Create an API key with sending and receiving access.
4. Set `RESEND_FROM_EMAIL` to an address on the verified domain.

Resend remains the source of message content. PostgreSQL stores client-specific state such as read status, folders, stars, labels, and drafts.

## Deploy to Vercel

1. Create a Neon or Vercel Postgres database.
2. Import the repository into Vercel.
3. Add every variable from `.env.example`.
4. Run `npm run db:deploy` against the production database.
5. Deploy.

## Routes

- `/inbox`, `/sent`, `/archive`, and other mailbox folders
- `/mail/[id]` for reloadable message links
- `/label/[id]` for label views

## Development

```bash
npm run lint
npm run build
npm run db:studio
```

## Security

- Resend and database credentials remain server-side.
- Authentication uses a signed, HttpOnly session cookie.
- Received HTML is rendered in a sandboxed iframe.
- Tracking pixels are removed from displayed messages.
