---
id: hosting
title: Hosting
sidebar_position: 7
---

# Hosting

## Environment variables

Set the following environment variables in your hosting environment:

```bash title=".env"
# Required in production — used to sign and verify sessions
BETTER_AUTH_SECRET=your-secret-here

# The public URL your Better Auth instance is reachable at
BETTER_AUTH_URL=https://your-app.example.com
```

Pass them to your Better Auth config:

```typescript title="config/better-auth.ts"
import { betterAuth } from "better-auth";
import { strapiAdapter } from "@strapi-community/plugin-better-auth";

const auth = () =>
  betterAuth({
    database: strapiAdapter(),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: ['http://localhost:3000'],
    advanced: {
      database: {
        generateId: "serial",
      },
    },
  });

export default auth;
```

## Strapi Cloud

When deploying to Strapi Cloud, the `strapi build` command runs during the deployment pipeline before environment variables like `BETTER_AUTH_SECRET` are available. This causes Better Auth to fail during the build because it tries to initialise with missing configuration.

Add an early return to skip initialisation during the build step:

```typescript title="config/better-auth.ts"
import { betterAuth } from "better-auth";
import { strapiAdapter } from "@strapi-community/plugin-better-auth";

const auth = () => {
  // Skip initialisation during the Strapi Cloud build step
  if (process.env.npm_lifecycle_script === "strapi build") {
    return null;
  }

  return betterAuth({
    database: strapiAdapter(),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: ['http://localhost:3000'],
    advanced: {
      database: {
        generateId: "serial",
      },
    },
  });
};

export default auth;
```

The plugin handles a `null` return value from the factory and will skip Better Auth initialisation, allowing the build to complete successfully.
