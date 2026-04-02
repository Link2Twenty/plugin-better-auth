---
id: integration
title: Using Both Plugins Together
sidebar_position: 4
---

# Using Both Plugins Together

`plugin-better-auth` and `plugin-api-permissions` are designed to work together out of the box. When both are installed, `plugin-better-auth` automatically registers a session resolver with `plugin-api-permissions` — no manual wiring required.

## Installation

Install all required packages:

```bash
npm install better-auth @strapi-community/plugin-better-auth @strapi-community/plugin-api-permissions
# or
pnpm add better-auth @strapi-community/plugin-better-auth @strapi-community/plugin-api-permissions
```

## Plugin configuration

Enable both plugins:

```typescript title="config/plugins.ts"
export default {
  'better-auth': {
    enabled: true,
  },
  'api-permissions': {
    enabled: true,
  },
};
```

## Better Auth configuration

```typescript title="config/better-auth.ts"
import { betterAuth } from 'better-auth';
import { strapiAdapter } from '@strapi-community/plugin-better-auth';

const auth = () =>
  betterAuth({
    database: strapiAdapter(),
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

## How the automatic wiring works

When `plugin-better-auth` detects that `plugin-api-permissions` is installed, it registers a session resolver during Strapi's register phase. The resolver:

1. Reads the Better Auth session from the incoming request headers (via cookies or the `Authorization` header).
2. Loads the user document from `plugin::better-auth.user` with its `roles` relation populated.
3. Returns `{ user, roles }` for authenticated requests or `null` for unauthenticated requests.

## Assigning roles to users

After a user signs up via Better Auth, they start with no custom roles. To give them access beyond the **Public** role:

1. Navigate to **Content Manager → Better Auth - User**.
2. Open the user's record.
3. In the **roles** relation field, add the desired role (e.g. **Authenticated**).
4. Save.

From that point on, all Content API requests made by that user will use the permissions of their assigned roles.

## Role defaults

| Scenario | Applied role |
|---|---|
| Request with no session | Public |
| Request with a valid Better Auth session, user has no roles | Authenticated (fallback) |
| Request with a valid Better Auth session, user has roles | All assigned roles |

## Full example flow

```
1. User calls POST /api/better-auth/sign-up/email
   → Better Auth creates user in plugin::better-auth.user

2. Admin assigns the "Authenticated" role to the user
   in Content Manager

3. User calls GET /api/articles (Content API)
   → Session resolver reads Better Auth cookie
   → Loads user + roles from DB
   → Returns { user, roles: [Authenticated] }
   → CASL ability is built from Authenticated role's permissions
   → Request is allowed if "find" is enabled for api::article.article

4. Unauthenticated call to GET /api/articles
   → Session resolver returns null
   → Public role is applied
   → Request is allowed only if "find" is enabled for the Public role
```

## Client-side example

```typescript title="lib/auth-client.ts"
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:1337/api/better-auth',
});
```

```typescript title="app/page.tsx"
import { authClient } from '@/lib/auth-client';

// Sign in
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
});

// Now fetch protected content
// The session cookie is sent automatically
const response = await fetch('http://localhost:1337/api/articles', {
  credentials: 'include',
});
const { data } = await response.json();
```
