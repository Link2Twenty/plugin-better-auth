---
id: schema
title: Schema
sidebar_position: 5
---

# Schema

## Table prefix

By default the plugin prefixes all Better Auth database tables with `ba_` (e.g. `ba_user`, `ba_session`). You can change this through the plugin config:

```typescript title="config/plugins.ts"
export default {
  "better-auth": {
    enabled: true,
    config: {
      table_prefix: "auth_",
    },
  },
};
```

The prefix must be snake_case and end with an underscore (e.g. `auth_`, `myapp_auth_`).

:::caution
Changing the prefix on an existing installation will rename all tables. Run a database migration to move existing data or you will lose it.
:::

## Table names

Better Auth lets you override the name of each individual model through the Better Auth config. This is useful if you need to avoid conflicts with existing tables or follow a naming convention that differs from Better Auth's defaults.

```typescript title="config/better-auth.ts"
import { betterAuth } from "better-auth";
import { strapiAdapter } from "@strapi-community/plugin-better-auth";

const auth = () =>
  betterAuth({
    database: strapiAdapter(),
    basePath: "/api/better-auth",
    trustedOrigins: ['http://localhost:3000'],
    advanced: {
      database: {
        generateId: "serial",
      },
    },
    user: {
      modelId: "custom_user",
    },
    session: {
      modelId: "custom_session",
    },
    account: {
      modelId: "custom_account",
    },
    verification: {
      modelId: "custom_verification",
    },
  });

export default auth;
```

After changing model IDs, re-run the schema generation command so Strapi picks up the new content type names:

```bash
npx auth generate --config config/better-auth.ts
```

Refer to the [Better Auth schema documentation](https://www.better-auth.com/docs/concepts/database#change-table-name) for the full list of customisation options.
