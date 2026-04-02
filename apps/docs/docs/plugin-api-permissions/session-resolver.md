---
id: session-resolver
title: Session Resolver
sidebar_position: 4
---

# Session Resolver

The session resolver is the bridge between your authentication provider and the plugin's permission system. It is called on every Content API request and must return the current user along with their assigned roles, or `null` for unauthenticated requests.

## Registering a session resolver

Register the resolver in Strapi's bootstrap function:

```typescript title="src/index.ts"
import type { Modules } from '@strapi/strapi';

export default {
  async bootstrap({ strapi }) {
    strapi
      .plugin('api-permissions')
      .service('session')
      .registerSessionResolver(async (ctx) => {
        // Extract the token from the request
        const token = ctx.request.headers.authorization?.replace('Bearer ', '');
        if (!token) return null;

        // Verify the token with your auth provider
        const session = await myAuthProvider.verifyToken(token);
        if (!session) return null;

        // Load the user document
        const user = await strapi.documents('plugin::my-auth.user').findFirst({
          filters: { id: session.userId },
        });
        if (!user) return null;

        // Load the user's roles
        const roles = await strapi
          .documents('plugin::api-permissions.role')
          .findMany({
            filters: { users: { id: user.id } },
          }) as Modules.Documents.Document<'plugin::api-permissions.role'>[];

        return { user, roles };
      });
  },
};
```

## Return value

The resolver must return either:

- `null` — the request is treated as unauthenticated and the **Public** role is applied.
- `{ user, roles }` — the resolved user and their roles. The **Authenticated** role is applied at minimum.

## Using with plugin-better-auth

When `plugin-better-auth` is installed, it automatically registers a session resolver that:

1. Reads the Better Auth session from the request headers.
2. Loads the corresponding user document from `plugin::better-auth.user`.
3. Returns the user and their associated roles.

You do not need to register a resolver manually in this case. See [Using Both Plugins Together](../integration) for the combined setup.

## Multiple resolvers

Only one session resolver can be active at a time. Calling `registerSessionResolver` a second time will override the first.

## Resolver signature

```typescript
type SessionResolver = (
  ctx: Koa.Context
) => Promise<{ user: Document; roles: Document[] } | null>;
```

Where `Document` is a Strapi document returned by the document service.
