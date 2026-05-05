---
id: better-auth
title: Better Auth
sidebar_label: Overview
sidebar_position: 1
---

# Better Auth

`@strapi-community/plugin-better-auth` is a [Better Auth](https://better-auth.com) database adapter that uses Strapi as the database backend. It integrates Better Auth's authentication system with your Strapi application by:

- Storing users, sessions, accounts, and verification tokens in Strapi content types.
- Exposing all Better Auth API endpoints at `/api/auth/`.
- Optionally wiring the authenticated session into [API Permissions](../api-permissions) for Content API RBAC.

## Features

- Full Better Auth database adapter implementation
- Uses Strapi's document service for all data operations
- Supports all Better Auth core features: users, sessions, accounts, verification
- All Better Auth endpoints available through Strapi's API
- Works with any Better Auth plugin (OAuth, magic link, two-factor, etc.)
- Works with Strapi v5+

## Content types

Content types are not registered automatically. You generate them by running the Better Auth CLI after configuring your auth instance — see [Installation](./installation) for details.

The plugin registers content types under the `plugin::better-auth` namespace based on your Better Auth config and the plugins you enable:

| Content type | UID | Description |
|---|---|---|
| User | `plugin::better-auth.user` | Authenticated users |
| Session | `plugin::better-auth.session` | Active user sessions |
| Account | `plugin::better-auth.account` | OAuth / credential accounts |
| Verification | `plugin::better-auth.verification` | Email verification tokens |

Additional content types are added automatically when you enable Better Auth plugins that require extra tables (e.g. two-factor, passkey, organization).

## Next steps

- [Installation](./installation)
- [Configuration](./configuration)
- [TypeScript](./typescript)
- [Schema](./schema)
- [Emails](./emails)
- [Hosting](./hosting)
- [Client Setup](./client-setup)
- [Server Usage](./server-usage)
- [Plugins](./plugins)
