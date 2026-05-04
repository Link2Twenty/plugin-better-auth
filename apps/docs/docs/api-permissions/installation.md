---
id: installation
title: Installation
sidebar_position: 2
---

# Installation

## 1. Install the package

```bash
npm install @strapi-community/plugin-api-permissions
# or
yarn add @strapi-community/plugin-api-permissions
# or
pnpm add @strapi-community/plugin-api-permissions
```

## 2. Enable the plugin

```typescript title="config/plugins.ts"
export default {
  'api-permissions': {
    enabled: true,
  },
};
```

## 3. Start Strapi

```bash
pnpm develop
```

On first start, the plugin will:

1. Extend your user content type with a `roles` manyToMany relation.
2. Register a `content-api` authentication strategy with Strapi.
3. Seed the database with a **Public** role and an **Authenticated** role.

Navigate to **Settings → API Permissions → Roles** to see the roles.

## Next steps

- [Configure the user content type](./configuration) (if not using `plugin-better-auth`)
- [Register a session resolver](./session-resolver) so the plugin knows who is making each request
