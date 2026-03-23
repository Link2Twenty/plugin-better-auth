# Strapi + Better Auth

A [Better Auth](https://better-auth.com) database adapter that uses [Strapi](https://strapi.io) as the database backend. This package allows you to integrate Better Auth's authentication system with your Strapi application seamlessly.


> [!CAUTION]  
> This plugin is in ALPHA state. It is by no means considered stable and should not be used in production. If you want to contribute to it's development, please contact any of the maintainers.

**Full flow documentation (API, Content Manager, config, troubleshooting):** [docs/AUTHENTICATION_FLOWS.md](./docs/AUTHENTICATION_FLOWS.md)

## Features

- ✅ Full Better Auth database adapter implementation
- ✅ Uses Strapi's document service for data management
- ✅ Supports all Better Auth core features (users, sessions, accounts, verification)
- ✅ All Better Auth endpoints available through Strapi API
- ✅ Works with Strapi v5+
- ✅ **Invite flow**: Create users from Content Manager and send "Set password" invites

## Installation

```bash
npm install better-auth @strapi-community/plugin-better-auth
# or
yarn add better-auth @strapi-community/plugin-better-auth
# or
pnpm add better-auth @strapi-community/plugin-better-auth
```

## Usage

### 1. Create a Better Auth config file

Create the Better Auth config file and add the following content.

```typescript
// config/better-auth.ts
import { betterAuth } from "better-auth";
import { strapiAdapter } from '@strapi-community/plugin-better-auth/adapter';

const auth = () => betterAuth({
  database: strapiAdapter(),
  advanced: {
    database: {
      generateId: "serial",
    },
  },
});

export default auth;
```

### 2. Client implementation

Call the Better Auth API from your front-end:

```typescript
// In your React/Vue/Svelte app
import { createAuthClient } from 'better-auth/react'; // or /vue, /svelte

const authClient = createAuthClient({
  baseURL: 'http://localhost:1337/api/better-auth',
});

// Sign up
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
});
```

### 4. Invite flow (users created from Content Manager)

When you create a user in the Content Manager, they have no password. Use the **Send invite** action to generate an invite link:

1. Create a user in Content Manager (Content Manager → Better Auth → Users)
2. Click **Send invite** in the document actions
3. The invite URL is copied to clipboard (or configure `sendInviteEmail` to email it)

**Set up a frontend page** at `/invite/set-password` that:
- Reads `token` from the URL query
- Shows a password form
- POSTs to `POST /api/better-auth/invite/set-password` with `{ token, password }`

**Invite emails:** The plugin uses Strapi's built-in email plugin by default. Ensure the [email plugin](https://docs.strapi.io/dev-docs/plugins/email) is configured with a provider (e.g. nodemailer, sendgrid). To customize the email, add `sendInviteEmail` to your plugin config:

```typescript
config: {
  sendInviteEmail: async ({ user, inviteUrl, strapi }) => {
    await strapi.plugin("email").service("email").send({
      to: user.email,
      subject: "Set your password",
      html: `Custom template: <a href="${inviteUrl}">${inviteUrl}</a>`,
    });
  },
},
```

**Note:** The `inviteUrl` points to your frontend (e.g. `http://localhost:3000/invite/set-password?token=...`). Use `server.url` in config or pass `callbackURL` when calling send-invite to set the base URL.

**Password reset:** To enable forgot-password flow, export `(strapi) => betterAuth({...})` so the plugin can inject `strapi` for `sendResetPassword`:

```typescript
// config/better-auth.js - export (strapi) => betterAuth() for sendResetPassword
module.exports = () => (strapi) =>
  betterAuth({
    database: strapiAdapter(),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await strapi.plugin("email").service("email").send({
          to: user.email,
          subject: "Reset your password",
          html: `Click here to reset: <a href="${url}">${url}</a>`,
        });
      },
    },
    advanced: { database: { generateId: "serial" } },
  });
```

Then add a forgot-password page that calls `authClient.requestPasswordReset({ email, redirectTo })` and a reset-password page that calls `authClient.resetPassword({ newPassword, token })`.

**Account linking**: Enable multiple auth methods (email/password + Google, etc.) per user in your Better Auth config:

```typescript
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ["credential", "google", "github"],
  },
},
```

### 5. Server side authentication

Use the Better Auth session to authenticate your users in custom Strapi controllers.

```typescript
// In a Strapi controller
export default {
  async customMethod(ctx) {
    // Access the Better Auth instance
    // @ts-expect-error - Accessing custom property
    const auth = strapi.internal_config['better-auth'];;
    
    // Use Better Auth API methods
    const session = await auth.api.getSession({
      headers: ctx.request.headers,
    });
    
    if (session) {
      // User is authenticated
      console.log('User:', session.user);
    }
  }
}
```

## Supported plugins

Any Better Auth plugin may be used with Strapi + Better Auth. Some plugins require you to run the `generate` CLI in order to make the required schema changes. In order to do that you have to manually specify the location of the Better Auth config file.

```bash
npx auth@latest generate --config config/better-auth.ts
```


## Resources

- [Better Auth Documentation](https://better-auth.com)
- [Better Auth Database Adapters](https://better-auth.com/docs/concepts/database)
- [Creating Custom Adapters](https://better-auth.com/docs/guides/create-a-db-adapter)
- [Strapi Documentation](https://docs.strapi.io)

## Authors

- [Boaz Poolman](https://github.com/boazpoolman)

## License

See the [LICENSE](./LICENSE.md) file for licensing information.
