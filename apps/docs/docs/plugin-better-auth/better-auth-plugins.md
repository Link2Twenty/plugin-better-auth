---
id: better-auth-plugins
title: Better Auth Plugins
sidebar_position: 6
---

# Better Auth Plugins

Better Auth has a rich plugin ecosystem. Any Better Auth plugin can be used with this Strapi adapter. Some plugins add new database tables that Strapi needs to know about — these require a schema generation step.

## Adding a plugin

Enable plugins in your Better Auth config:

```typescript title="config/better-auth.ts"
import { betterAuth } from 'better-auth';
import { twoFactor } from 'better-auth/plugins';
import { strapiAdapter } from '@strapi-community/plugin-better-auth';

const auth = () =>
  betterAuth({
    database: strapiAdapter(),
    advanced: {
      database: {
        generateId: 'serial',
      },
    },
    plugins: [
      twoFactor(),
    ],
  });

export default auth;
```

## Schema generation

Plugins that introduce new tables (e.g. two-factor, passkey, organization) require you to run Better Auth's `generate` CLI so Strapi picks up the new content types.

```bash
npx auth@latest generate --config config/better-auth.ts
```

:::note
You must specify `--config config/better-auth.ts` because the CLI cannot auto-detect the config location in a Strapi project.
:::

After running the command, restart Strapi in development mode. The new content types will be registered automatically:

```bash
pnpm develop
```

## Popular plugins

| Plugin | npm import | Extra schema |
|---|---|---|
| Two-factor auth | `better-auth/plugins` → `twoFactor` | Yes |
| Magic link | `better-auth/plugins` → `magicLink` | No |
| Passkey / WebAuthn | `better-auth/plugins` → `passkey` | Yes |
| OAuth (social login) | Built-in via `socialProviders` | No |
| Organization | `better-auth/plugins` → `organization` | Yes |
| Admin | `better-auth/plugins` → `admin` | No |
| Anonymous | `better-auth/plugins` → `anonymous` | No |

Refer to the [Better Auth plugin documentation](https://better-auth.com/docs/plugins) for the full list.

## Example: OAuth (Google)

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
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  });

export default auth;
```

Then in your front-end:

```typescript
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/dashboard',
});
```
