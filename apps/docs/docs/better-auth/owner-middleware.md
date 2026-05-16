---
id: owner-middleware
title: Owner Middleware
sidebar_position: 10
---

# Owner Middleware

A common pattern in content-driven apps is letting authenticated users create entries and then restricting edits and deletes to the original author. This is done with two pieces:

1. An **`owner` relation field** on your content type that links an entry back to the Better Auth user who created it.
2. An **`isOwner` middleware** that runs before `update` and `delete` routes and returns `401` if the session user is not the entry's owner.

## 1. Add an owner field to your content type

Add a relation field to your content type that points at `plugin::better-auth.user`. The relation is many-to-one: many entries can belong to one user.

You can do this through the Strapi Admin **Content-Type Builder**, or directly in the schema JSON:

```json title="src/api/article/content-types/article/schema.json"
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": { "singularName": "article", "pluralName": "articles", "displayName": "Article" },
  "attributes": {
    "title": { "type": "string", "required": true },
    "body":  { "type": "richtext" },
    "owner": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::better-auth.user"
    }
  }
}
```

## 2. Auto-assign the owner on create

Override the `create` action in your controller to populate `owner` from the active session before the entry is saved. This way the client never has to send an owner ID, and it cannot be spoofed.

```typescript title="src/api/article/controllers/article.ts"
import { factories } from '@strapi/strapi';
import { auth } from '@/lib/auth';

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  async create(ctx) {
    const session = await auth.api.getSession({ headers: ctx.request.headers });

    if (!session) {
      return ctx.unauthorized('You must be logged in to create an article.');
    }

    ctx.request.body.data = {
      ...ctx.request.body.data,
      owner: session.user.id,
    };

    return super.create(ctx);
  },
}));
```

## 3. Create the isOwner middleware

Generate a middleware file for your API and replace its contents with the ownership check. The middleware reads the session from the incoming request headers using `auth.api.getSession` — the same call used everywhere else in the Better Auth integration.

```typescript title="src/api/article/middlewares/isOwner.ts"
import type { Core } from '@strapi/strapi';
import { auth } from '@/lib/auth';

export default (config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const session = await auth.api.getSession({ headers: ctx.request.headers });

    if (!session) {
      return ctx.unauthorized('You must be logged in.');
    }

    const { id } = ctx.params;

    if (id) {
      const entry = await strapi.documents('api::article.article').findOne(id, {
        populate: ['owner'],
      });

      if (!entry) {
        return ctx.notFound();
      }

      if (entry.owner?.id !== session.user.id) {
        return ctx.unauthorized('You are not the owner of this entry.');
      }
    }

    return next();
  };
};
```

:::note
The middleware only runs on routes where an `:id` parameter is present (`update`, `delete`). The `if (id)` guard is a safety net for any edge cases where the parameter might be absent.
:::

## 4. Apply the middleware to update and delete routes

Attach the middleware to the routes that mutate data. Pass it through the `config` option of `createCoreRouter`:

```typescript title="src/api/article/routes/article.ts"
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::article.article', {
  config: {
    update: {
      middlewares: ['api::article.is-owner'],
    },
    delete: {
      middlewares: ['api::article.is-owner'],
    },
  },
});
```

Strapi derives the middleware identifier from the filename (`isOwner.ts` → `is-owner`) and the API name (`api::article`). Adjust the string if your API or file is named differently.

## How it fits together

| Action | Who can do it | Enforced by |
|--------|--------------|-------------|
| `find` / `findOne` | Anyone (subject to API token / permissions) | — |
| `create` | Any authenticated user | `is-authenticated` policy (see [Server Usage](./server-usage)) |
| `update` / `delete` | The entry's owner only | `isOwner` middleware |

With this setup a user can create, read, and edit their own articles, but cannot touch another user's content.
