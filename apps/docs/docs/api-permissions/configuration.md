---
id: configuration
title: Configuration
sidebar_position: 3
---

# Configuration

## Plugin options

| Option | Type | Default | Description |
|---|---|---|---|
| `user_uid` | `string` | Resolved from Better Auth | The UID of the content type that represents your users. Used to count role members and reassign users when a role is deleted. |

## Setting the user content type

If you are **not** using Better Auth, you need to tell the plugin which content type represents your users by setting `user_uid`.

```typescript title="config/plugins.ts"
export default {
  'api-permissions': {
    enabled: true,
    config: {
      user_uid: 'plugin::users-permissions.user',
    },
  },
};
```

Replace `'plugin::users-permissions.user'` with the UID of your actual user content type. For example:

| Auth provider | `user_uid` |
|---|---|
| Strapi Users & Permissions | `plugin::users-permissions.user` |
| Custom plugin | `plugin::my-auth.user` |
| Custom API | `api::user.user` |

## Using with Better Auth

When [Better Auth](../better-auth) is installed, `user_uid` is resolved automatically to `plugin::better-auth.user`. No `user_uid` configuration is needed.

```typescript title="config/plugins.ts"
export default {
  'better-auth': {
    enabled: true,
  },
  'api-permissions': {
    enabled: true,
    // No user_uid needed — resolved automatically
  },
};
```
