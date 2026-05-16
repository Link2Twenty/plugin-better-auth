---
id: public-api
title: Public API
sidebar_position: 9
---

# Public API

Better Auth data is **private by default**. User records contain sensitive fields such as password hashes, email verification state, ban metadata, and linked OAuth accounts. Strapi's Content API does not expose any of the `plugin::better-auth` content types unless you explicitly wire them up — this is intentional.

## When you might want a public API

Some applications need to surface auth-managed data to unauthenticated visitors. A few common examples:

- A **user profile page** that shows a display name, avatar, and bio (similar to `github.com/:username`)
- An **organization page** that shows the org name, logo, and a member count
- A **directory** listing all public organizations on a platform

In these cases you can expose a read-only subset of the data through Strapi's Content API. The key requirement is that **you must sanitize the response** — strip every field that should not be public — before the data leaves the server.

## Extending the plugin

Strapi's plugin extension system lets you attach controllers, services, and routes to an existing plugin without forking it. Create `src/extensions/better-auth/strapi-server.ts` in your Strapi project and export a function that receives the plugin and returns a modified version of it.

```typescript title="src/extensions/better-auth/strapi-server.ts"
import { factories } from '@strapi/strapi';

const userController = factories.createCoreController('plugin::better-auth.user');
const organizationController = factories.createCoreController('plugin::better-auth.organization');

const userService = factories.createCoreService('plugin::better-auth.user');
const organizationService = factories.createCoreService('plugin::better-auth.organization');

export default (plugin) => {
  plugin.controllers.user = userController;
  plugin.controllers.organization = organizationController;

  if (!plugin.services) plugin.services = {};
  plugin.services.user = userService;
  plugin.services.organization = organizationService;

  plugin.routes['content-api'] = {
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/users',
        handler: 'user.find',
        config: { policies: [], prefix: '' },
      },
      {
        method: 'GET',
        path: '/users/:id',
        handler: 'user.findOne',
        config: { policies: [], prefix: '' },
      },
      {
        method: 'GET',
        path: '/organizations',
        handler: 'organization.find',
        config: { policies: [], prefix: '' },
      },
      {
        method: 'GET',
        path: '/organizations/:id',
        handler: 'organization.findOne',
        config: { policies: [], prefix: '' },
      },
    ],
  };

  return plugin;
};
```

`factories.createCoreController` gives you the standard `find` and `findOne` actions for free. The same applies to `factories.createCoreService`. No extra code is needed for the default list and detail endpoints.

Once the file is in place, restart Strapi. The endpoints below will become available through the Content API:

| Method | Path | Handler |
|--------|------|---------|
| `GET` | `/api/users` | `user.find` |
| `GET` | `/api/users/:id` | `user.findOne` |
| `GET` | `/api/organizations` | `organization.find` |
| `GET` | `/api/organizations/:id` | `organization.findOne` |

You also need to grant access for these routes. Either through a Content API token, or through the API Permissions plugin.

## Sanitizing the response

:::danger
**Never return raw Better Auth records to the public.** User documents contain hashed passwords, email verification tokens, and ban metadata. Organization documents may contain internal configuration. Always strip these fields before sending the response.
:::

Override the `find` and `findOne` actions in your controller to pick only the fields you want to expose:

```typescript title="src/extensions/better-auth/strapi-server.ts"
import { factories } from '@strapi/strapi';

const SAFE_USER_FIELDS = ['id', 'name', 'image'] as const;
const SAFE_ORG_FIELDS  = ['id', 'name', 'slug', 'logo'] as const;

const userController = factories.createCoreController(
  'plugin::better-auth.user',
  () => ({
    async find(ctx) {
      ctx.query = { ...ctx.query, fields: [...SAFE_USER_FIELDS] };
      return super.find(ctx);
    },
    async findOne(ctx) {
      ctx.query = { ...ctx.query, fields: [...SAFE_USER_FIELDS] };
      return super.findOne(ctx);
    },
  }),
);

const organizationController = factories.createCoreController(
  'plugin::better-auth.organization',
  () => ({
    async find(ctx) {
      ctx.query = { ...ctx.query, fields: [...SAFE_ORG_FIELDS] };
      return super.find(ctx);
    },
    async findOne(ctx) {
      ctx.query = { ...ctx.query, fields: [...SAFE_ORG_FIELDS] };
      return super.findOne(ctx);
    },
  }),
);
```

Forcing the `fields` parameter on the incoming query means callers cannot request sensitive fields even if they try.
