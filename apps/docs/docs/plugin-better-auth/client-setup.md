---
id: client-setup
title: Client Setup
sidebar_position: 4
---

# Client Setup

Better Auth provides framework-specific client helpers for React, Vue, Svelte, and more. All of them point to the Strapi-hosted Better Auth API at `/api/better-auth`.

## Installation

Install the Better Auth client in your front-end project:

```bash
npm install better-auth
# or
pnpm add better-auth
```

## React

```typescript title="lib/auth-client.ts"
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:1337/api/better-auth',
});
```

### Sign up

```typescript
import { authClient } from '@/lib/auth-client';

await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'Jane Doe',
});
```

### Sign in

```typescript
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
});
```

### Sign out

```typescript
await authClient.signOut();
```

### Get the current session

```typescript
const { data: session } = authClient.useSession();

if (session) {
  console.log('Logged in as', session.user.email);
}
```

## Vue

```typescript title="lib/auth-client.ts"
import { createAuthClient } from 'better-auth/vue';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:1337/api/better-auth',
});
```

## Vanilla JS / other frameworks

```typescript title="lib/auth-client.ts"
import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:1337/api/better-auth',
});
```

## API base URL

The Better Auth API is mounted at `/api/better-auth` by default. All Better Auth endpoints (e.g. `/sign-in/email`, `/sign-up/email`, `/get-session`) are available under this path.

| Endpoint | URL |
|---|---|
| Sign up | `POST /api/better-auth/sign-up/email` |
| Sign in | `POST /api/better-auth/sign-in/email` |
| Sign out | `POST /api/better-auth/sign-out` |
| Get session | `GET /api/better-auth/get-session` |

:::tip
Refer to the [Better Auth documentation](https://better-auth.com/docs) for the full list of endpoints and client methods available for each plugin.
:::
