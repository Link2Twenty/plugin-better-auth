# Quick Start Guide - Strapi Better Auth Adapter

This guide will help you get started with the Strapi Better Auth adapter quickly.

## Installation

```bash
pnpm add @repo/strapi-better-auth better-auth
```

## Basic Setup

### 1. Enable the Plugin

Add the plugin to your Strapi configuration:

```typescript
// config/plugins.ts
export default {
  'strapi-better-auth': {
    enabled: true,
  },
};
```

**That's it!** The plugin will automatically:
- Create the required content types (user, session, account, verification)
- Initialize Better Auth with email/password authentication
- Expose all Better Auth API endpoints at `/api/strapi-better-auth/auth/*`

### 2. Use Better Auth API Endpoints

All Better Auth endpoints are now available through your Strapi API:

```bash
# Sign up
curl -X POST http://localhost:1337/api/strapi-better-auth/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Sign in
curl -X POST http://localhost:1337/api/strapi-better-auth/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get session
curl http://localhost:1337/api/strapi-better-auth/auth/session \
  -H "Cookie: better-auth.session_token=..."
```

### 3. Use from Your Frontend

Install Better Auth client in your frontend app:

```bash
npm install better-auth
```

Then use it:

```typescript
import { createAuthClient } from 'better-auth/react'; // or /vue, /svelte

const authClient = createAuthClient({
  baseURL: 'http://localhost:1337/api/strapi-better-auth/auth',
});

// Sign up
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
});

// Sign in
const { data, error } = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
});

// Get current session
const session = await authClient.getSession();
```

## Content Types Created

The plugin automatically creates these content types:

- `plugin::strapi-better-auth.user` - Users
- `plugin::strapi-better-auth.session` - Active sessions
- `plugin::strapi-better-auth.account` - Linked accounts (OAuth, email/password)
- `plugin::strapi-better-auth.verification` - Email verification tokens

These will be visible in your Strapi admin panel under "Plugins > Strapi Better Auth".

## Configure Social Providers (Optional)

To add social authentication providers:

```typescript
// config/plugins.ts
export default {
  'strapi-better-auth': {
    enabled: true,
    config: {
      betterAuth: {
        socialProviders: {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          },
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        },
      },
    },
  },
};
```

## Environment Variables

Add these to your `.env` file:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Add other providers as needed
```

## Next Steps

- Check the [Better Auth Documentation](https://better-auth.com) for more features
- Explore Better Auth plugins for additional functionality (2FA, OAuth, etc.)
- Customize the content types if needed
- Add custom fields to user/session models

## Troubleshooting

### Debug Logs

Enable debug logging to see what the adapter is doing:

```typescript
strapiAdapter({
  strapi,
  debugLogs: true, // or { create: true, update: true }
})
```

### Content Types Not Showing

1. Restart your Strapi server
2. Check that the plugin is enabled in `config/plugins.ts`
3. Look for errors in the console

### Type Errors

The adapter uses TypeScript but includes necessary type assertions for compatibility. If you encounter type errors, ensure you're using compatible versions of Strapi and Better Auth.

## Support

For issues specific to this adapter, check the package README or create an issue in the repository.
For Better Auth questions, visit [better-auth.com](https://better-auth.com).
