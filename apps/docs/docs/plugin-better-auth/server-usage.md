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

## Checking permissions manually

If you are not using `plugin-api-permissions`, you can implement your own permission checks using the session:

```typescript
const session = await auth.api.getSession({
  headers: ctx.request.headers,
});

if (!session) {
  return ctx.unauthorized();
}

const user = await strapi.documents('plugin::better-auth.user').findOne({
  documentId: session.user.id,
});

if (!user) {
  return ctx.forbidden();
}
```

## Using Better Auth admin API

Better Auth exposes server-side admin methods. These can be called directly without an HTTP request:

```typescript
// Create a user programmatically
const { user } = await auth.api.createUser({
  body: {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'securepassword',
    role: 'admin',
  },
});

// Ban a user
await auth.api.banUser({
  body: { userId: user.id },
});

// List all sessions for a user
const sessions = await auth.api.listUserSessions({
  body: { userId: user.id },
});
```

:::note
Admin API methods require the Better Auth `admin` plugin to be enabled in your `config/better-auth.ts`.
:::

## Strapi bootstrap integration

You can run setup logic that depends on Better Auth during Strapi's bootstrap phase:

```typescript title="src/index.ts"
export default {
  async bootstrap({ strapi }) {
    const auth = strapi.internal_config['better-auth'];

    // Example: seed an admin user on first run
    const existingUsers = await strapi.documents('plugin::better-auth.user').findMany({});

    if (existingUsers.length === 0) {
      await auth.api.createUser({
        body: {
          name: 'Admin',
          email: process.env.ADMIN_EMAIL!,
          password: process.env.ADMIN_PASSWORD!,
        },
      });
    }
  },
};
```
