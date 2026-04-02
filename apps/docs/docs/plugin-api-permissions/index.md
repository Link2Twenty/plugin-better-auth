---
id: plugin-api-permissions
title: plugin-api-permissions
sidebar_label: Overview
sidebar_position: 1
---

# plugin-api-permissions

`@strapi-community/plugin-api-permissions` provides Content API role-based access control (RBAC) for Strapi v5. It is **auth-provider agnostic** — it works with any authentication system through a pluggable session resolver interface.

## Features

- Role management UI in the Strapi admin panel (under **Settings → API Permissions → Roles**)
- Fine-grained permissions per content type: `find`, `findOne`, `create`, `update`, `delete`
- Plugin endpoint permissions
- Two default roles created on first run: **Public** and **Authenticated**
- Pluggable session resolver — wire in any auth provider
- Automatically extends your user content type with a `roles` manyToMany relation
- Works standalone or paired with `plugin-better-auth`
- Works with Strapi v5+

## Content types created

| Content type | UID | Description |
|---|---|---|
| Role | `plugin::api-permissions.role` | A named role with a set of permissions |
| Permission | `plugin::api-permissions.permission` | A single action allowed for a role |

## Default roles

| Role | Slug | Description |
|---|---|---|
| Public | `public` | Applied to unauthenticated requests. Cannot be deleted. |
| Authenticated | `authenticated` | Applied to requests with a valid session. |

## Next steps

- [Installation](./installation)
- [Configuration](./configuration)
- [Session Resolver](./session-resolver)
- [Admin Panel](./admin-panel)
- [How It Works](./how-it-works)
