---
id: dashboard
title: Dashboard
sidebar_position: 2
---

# Dashboard

A pre-built dashboard can be installed separately that runs inside your Strapi admin panel. See usage information like DAU, manage sessions, disable 2FA and much more.

![Dashboard overview page showing metrics, growth chart, and retention analysis](/img/dashboard/overview.png)

## Installation

The additional dashboard plugin requires you to have the Better Auth plugin already installed and configured.

### Packages

```bash
npm install @better-auth/infra @strapi-community/plugin-better-auth-dashboard
# or
yarn add @better-auth/infra @strapi-community/plugin-better-auth-dashboard
# or
pnpm add @better-auth/infra @strapi-community/plugin-better-auth-dashboard
```

### Configuration

:::warning
This plugin only works if you have not changed the `basePath` of Better Auth. It needs to be the default `/api/auth` path.
:::

In order to run this plugin you need to configure the `dash()` and `jwt()` plugins from Better Auth.

```typescript title="src/lib/auth.ts"
import { dash } from "@better-auth/infra";
import { betterAuth } from 'better-auth';
import { jwt } from 'better-auth/plugins';
import { strapiAdapter } from '@strapi-community/plugin-better-auth';

export const auth = betterAuth({
  database: strapiAdapter(),
  trustedOrigins: ['http://localhost:3000'],
  plugins: [
    jwt(),
    dash({
      apiUrl: process.env.STRAPI_URL || "http://localhost:1337",
      apiKey:
        process.env.BETTER_AUTH_DASHBOARD_SECRET ||
        "strapi-internal-dashboard-key",
    }),
  ],
  advanced: {
    database: {
      generateId: 'serial',
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});
```

### Start Strapi

```bash
pnpm develop
```

The dashboard is now available in the Strapi admin panel.

## Adaptive UI

The dashboard detects which Better Auth plugins you have enabled and adapts its interface automatically:

| Better Auth plugin | Dashboard effect |
|---|---|
| `admin` (ban users) | Enables the **Ban** action on users and bulk ban in the Users page |
| `organization` | Adds the **Organizations** page to the navigation |
| `twoFactor` | Shows 2FA enrollment status in the user detail drawer |
| `emailVerification` | Shows email verification status and exposes a resend action |
