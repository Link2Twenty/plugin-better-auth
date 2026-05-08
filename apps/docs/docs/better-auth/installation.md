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

:::note
You must to be running **Strapi 5.45.0** or higher.
:::

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
    trustedOrigins: ['http://localhost:3000'],
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

## 4. Generate the schema

The plugin does not register any content types automatically. You must run the Better Auth CLI to generate the Strapi schema files:

```bash
npx auth generate --config config/better-auth.ts
```

:::note
You must specify `--config config/better-auth.ts` because the CLI cannot auto-detect the config location in a Strapi project.
:::

## 5. Start Strapi

Start Strapi in development mode. The generated content types will be picked up and registered:

```bash
pnpm develop
```

The Better Auth API is now available at `http://localhost:1337/api/auth/`.
