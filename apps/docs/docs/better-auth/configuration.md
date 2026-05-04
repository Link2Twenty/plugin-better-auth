---
id: configuration
title: Configuration
sidebar_position: 3
---

# Configuration

## Better Auth config

The Better Auth config file (`config/better-auth.ts`) is the central place for configuring authentication behaviour. It is a factory function that returns a configured Better Auth instance so Strapi can initialise it after the plugin system is ready.

```typescript title="config/better-auth.ts"
import { betterAuth } from 'better-auth';
import { strapiAdapter } from '@strapi-community/plugin-better-auth';

const auth = () =>
  betterAuth({
    database: strapiAdapter(),
    basePath: '/api/better-auth',
    trustedOrigins: ['http://localhost:3000'],
    advanced: {
      database: {
        generateId: 'serial',
      },
    },
    emailAndPassword: {
      enabled: true,
    },
  });

export default auth;
```

### Required options

Two options are fixed and **must not be changed**:

- **`basePath: '/api/better-auth'`** — This is the path where Strapi mounts the Better Auth request handler. The plugin expects all Better Auth requests at exactly this path.
- **`advanced.database.generateId: 'serial'`** — Tells Better Auth to use auto-incremented integer IDs, which aligns with Strapi's default ID strategy. Changing this will break the Strapi adapter.

### Accessing the Better Auth instance

The configured Better Auth instance is stored on Strapi's internal config and can be accessed anywhere in your Strapi code:

```typescript
const auth = strapi.internal_config['better-auth'];
```

## Trusted origins

Better Auth protects against CSRF attacks by validating that requests come from a known origin. In a typical Strapi setup, your front-end app runs on a different origin than Strapi (e.g. `http://localhost:3000` vs `http://localhost:1337`). Without listing your front-end URL in `trustedOrigins`, Better Auth will reject those cross-origin requests.

Add the URL of your front-end to `trustedOrigins`:

```typescript title="config/better-auth.ts"
const auth = () =>
  betterAuth({
    // ...
    trustedOrigins: ['http://localhost:3000'],
  });
```

In production set this to the public URL of your deployed front-end. Multiple origins can be listed if needed.

## Cookie settings

In production you typically want secure, cross-site cookies. Set the `defaultCookieAttributes` option based on your environment:

```typescript title="config/better-auth.ts"
const auth = () =>
  betterAuth({
    // ...
    basePath: '/api/better-auth',
    trustedOrigins: ['http://localhost:3000'],
    advanced: {
      database: {
        generateId: 'serial',
      },
      defaultCookieAttributes: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      },
    },
  });
```

This is required when your front-end and Strapi are on different origins (e.g. a separate Vercel deployment talking to Strapi Cloud).

## Environment variables

Set the following in your `.env` file:

```bash title=".env"
# Required in production — used to sign sessions
BETTER_AUTH_SECRET=your-secret-here

# The public URL your Strapi instance is reachable at
BETTER_AUTH_URL=http://localhost:1337
```

Pass them to the config:

```typescript title="config/better-auth.ts"
import { betterAuth } from 'better-auth';
import { strapiAdapter } from '@strapi-community/plugin-better-auth';

const auth = () =>
  betterAuth({
    database: strapiAdapter(),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    basePath: '/api/better-auth',
    trustedOrigins: ['http://localhost:3000'],
    advanced: {
      database: {
        generateId: 'serial',
      },
    },
  });

export default auth;
```
