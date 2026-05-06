---
id: typescript
title: TypeScript
sidebar_position: 4
---

# TypeScript

To get proper TypeScript support when accessing the Better Auth instance from Strapi, you need to extend Strapi's internal types.

## Extending Strapi types

Create a new file in the `types` directory of your Strapi app:

```typescript title="types/better-auth.d.ts"
import type {} from "@strapi/types/dist/core/strapi";

declare module "@strapi/types/dist/core/strapi" {
  interface StrapiInternalConfig {
    "better-auth": import("better-auth").Auth;
  }

  interface Strapi {
    internal_config: StrapiInternalConfig;
  }
}
```

Once this file is in place, TypeScript will correctly type the Better Auth instance when you access it:

```typescript
// Fully typed — no casting required
const auth = strapi.internal_config["better-auth"];
```
