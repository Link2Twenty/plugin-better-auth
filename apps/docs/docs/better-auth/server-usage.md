---
id: server-usage
title: Server Usage
sidebar_position: 5
---

# Server Usage

You can interact with the Better Auth instance directly from Strapi controllers, services, and middleware.

## Accessing the Better Auth instance

The configured Better Auth instance is attached to Strapi's internal config after the plugin initialises:

```typescript
const auth = strapi.internal_config['better-auth'];
```

## Reading the session in a controller

Use `auth.api.getSession` to verify the session from an incoming request:

```typescript title="src/api/my-resource/controllers/my-resource.ts"
export default {
  async protectedAction(ctx) {
    const auth = strapi.internal_config['better-auth'];

    const session = await auth.api.getSession({
      headers: ctx.request.headers,
    });

    if (!session) {
      return ctx.unauthorized('You must be logged in.');
    }

    // session.user — the authenticated user
    // session.session — the active session record
    ctx.body = { message: `Hello, ${session.user.name}!` };
  },
};
```

## Protecting routes with a policy

Strapi policies are the idiomatic way to guard routes. Create a global policy that checks for an active Better Auth session and apply it to any route that requires authentication.

```typescript title="src/policies/is-authenticated.ts"
import type { Core } from '@strapi/strapi';

export default async (
  policyContext: any,
  _config: any,
  { strapi }: { strapi: Core.Strapi },
) => {
  const auth = strapi.internal_config['better-auth'];

  const session = await auth.api.getSession({
    headers: policyContext.request.headers,
  });

  return session !== null;
};
```

Apply the policy to a route:

```typescript title="src/api/my-resource/routes/my-resource.ts"
export default {
  routes: [
    {
      method: 'GET',
      path: '/my-resource',
      handler: 'my-resource.find',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
  ],
};
```

Strapi will call the policy before the handler and automatically return a `403 Forbidden` response if it returns `false`.
