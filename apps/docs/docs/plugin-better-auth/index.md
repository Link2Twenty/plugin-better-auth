---
id: plugin-better-auth
title: plugin-better-auth
sidebar_label: Overview
sidebar_position: 1
---

# plugin-better-auth

`@strapi-community/plugin-better-auth` is a [Better Auth](https://better-auth.com) database adapter that uses Strapi as the database backend. It integrates Better Auth's authentication system with your Strapi application by:

- Storing users, sessions, accounts, and verification tokens in Strapi content types.
- Exposing all Better Auth API endpoints at `/api/better-auth/`.
- Optionally wiring the authenticated session into [`plugin-api-permissions`](../plugin-api-permissions) for Content API RBAC.

## Features

- Full Better Auth database adapter implementation
- Uses Strapi's document service for all data operations
- Supports all Better Auth core features: users, sessions, accounts, verification
- All Better Auth endpoints available through Strapi's API
- Works with any Better Auth plugin (OAuth, magic link, two-factor, etc.)
- Works with Strapi v5+

## Content types created

The plugin registers the following content types under the `plugin::better-auth` namespace:

| Content type | UID | Description |
|---|---|---|
| User | `plugin::better-auth.user` | Authenticated users |
| Session | `plugin::better-auth.session` | Active user sessions |
| Account | `plugin::better-auth.account` | OAuth / credential accounts |
| Verification | `plugin::better-auth.verification` | Email verification tokens |

## Next steps

- [Installation](./installation)
- [Configuration](./configuration)
- [Client Setup](./client-setup)
- [Server Usage](./server-usage)
- [Better Auth Plugins](./better-auth-plugins)
