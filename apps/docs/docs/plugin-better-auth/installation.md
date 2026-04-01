---
id: installation
title: Installation
sidebar_position: 2
---

# Installation

## 1. Install the packages

Install `better-auth` and `@strapi-community/plugin-better-auth` together:

```bash
npm install better-auth @strapi-community/plugin-better-auth
# or
yarn add better-auth @strapi-community/plugin-better-auth
# or
pnpm add better-auth @strapi-community/plugin-better-auth
```

## 2. Enable the plugin

Add the plugin to your Strapi plugin configuration:

```typescript title="config/plugins.ts"
export default {
  'better-auth': {
    enabled: true,
  },
};
```

## 3. Create a Better Auth config file

Create a Better Auth configuration file that uses the Strapi adapter:

```typescript title="config/better-auth.ts"
import { betterAuth } from 'better-auth';
import { strapiAdapter } from '@strapi-community/plugin-better-auth';

const auth = () =>
  betterAuth({
    database: strapiAdapter(),
    advanced: {
      database: {
        generateId: 'serial',
      },
    },
  });

export default auth;
```

:::note
The `generateId: "serial"` option tells Better Auth to use auto-incremented integer IDs, which aligns with Strapi's default document ID strategy.
:::

## 4. Verify the setup

Start Strapi in development mode and confirm that the Better Auth content types are created:

```bash
pnpm develop
```

Navigate to **Content-Type Builder** in the Strapi admin. You should see the following new content types:

- `Better Auth - User`
- `Better Auth - Session`
- `Better Auth - Account`
- `Better Auth - Verification`

The Better Auth API is now available at `http://localhost:1337/api/better-auth/`.
