---
id: how-it-works
title: How It Works
sidebar_position: 6
---

# How It Works

## Startup

When Strapi starts with `plugin-api-permissions` enabled, the plugin:

1. **Extends the user content type** with a `roles` manyToMany relation pointing to `plugin::api-permissions.role`. This is done dynamically — no manual schema change is required.
2. **Registers a `content-api` authentication strategy** with Strapi's authentication system. This strategy runs before every Content API request.
3. **Seeds the database** with a **Public** and an **Authenticated** role if none exist yet.

## Per-request flow

For every incoming Content API request, the authentication strategy:

1. **Calls the registered session resolver** with the Koa context, passing the full request object.
2. **Resolves the roles:**
   - If the resolver returns `null` → uses the **Public** role.
   - If the resolver returns `{ user, roles }` → uses the returned roles, plus the **Authenticated** role as a baseline.
3. **Loads permissions** for all resolved roles from the database.
4. **Builds a CASL ability** from those permissions and attaches it to the request context.
5. **Strapi's route middleware** checks the ability before executing the controller.

## Permission model

Each permission record stores:

- `action` — one of `find`, `findOne`, `create`, `update`, `delete`, or a plugin-specific action string.
- `subject` — the UID of the content type or plugin endpoint (e.g. `api::article.article`).
- `role` — the role this permission belongs to.

CASL uses the `(action, subject)` pair to determine whether a request is allowed.

## Role inheritance

There is no role inheritance. Each role's permissions are independent. If a user has multiple roles, the **union** of all permissions from all roles is applied.

## Middleware integration

The plugin registers a global middleware on all Content API routes. This middleware:

1. Checks if the route requires authentication.
2. If yes, verifies the CASL ability built from the resolved roles.
3. Returns `403 Forbidden` if the ability does not permit the action.

## Diagram

```
Incoming Content API Request
          │
          ▼
  Session Resolver (your code)
          │
          ▼
   Resolve Roles (DB lookup)
          │
          ▼
  Build CASL Ability (permissions)
          │
          ▼
  Strapi Route Middleware
          │
    ┌─────┴─────┐
  Allowed?     No → 403 Forbidden
    │
    ▼
  Controller runs
```
