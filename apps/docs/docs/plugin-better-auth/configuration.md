---
id: configuration
title: Configuration
sidebar_position: 3
---

# Configuration

## Better Auth config

The Better Auth config file (`config/better-auth.ts`) is the central place for configuring authentication behaviour. It is a factory function that returns a configured Better Auth instance so Strapi can initialise it after the plugin system is ready.

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
    // Add email/password auth
    emailAndPassword: {
      enabled: true,
    },
  });

export default auth;
```

### Accessing the Better Auth instance

The configured Better Auth instance is stored on Strapi's internal config and can be accessed anywhere in your Strapi code:

```typescript
const auth = strapi.config.get('internal_config')['better-auth'];
```

Or, more concisely, from within a controller or service:

```typescript
const auth = strapi.internal_config['better-auth'];
```

## Plugin options

The plugin itself does not expose additional configuration options. All authentication behaviour is configured through the Better Auth config file.

## Strapi plugin config

```typescript title="config/plugins.ts"
export default {
  'better-auth': {
    enabled: true,
  },
};
```

## Environment variables

Better Auth supports reading secrets from environment variables. Set the following in your `.env` file:

```bash title=".env"
# Required in production — used to sign sessions
BETTER_AUTH_SECRET=your-secret-here

# The public URL your Better Auth instance is reachable at
BETTER_AUTH_URL=http://localhost:1337
```

Pass them to the config:

```typescript title="config/better-auth.ts"
import { betterAuth } from 'better-auth';
import { strapiAdapter } from '@strapi-community/plugin-better-auth';

const auth = () =>
  betterAuth({
    database: strapiAdapter(),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    advanced: {
      database: {
        generateId: 'serial',
      },
    },
  });

export default auth;
```
