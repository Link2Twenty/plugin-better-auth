# Strapi + Better Auth

A [Better Auth](https://better-auth.com) database adapter that uses [Strapi](https://strapi.io) as the database backend. This package allows you to integrate Better Auth's authentication system with your Strapi application seamlessly.


> [!DANGER]  
> This plugin is in ALPHA state. It is by no means considered stable and should not be used in production. If you want to contribute to it's development, please contact any of the maintainers.

## Features

- ✅ Full Better Auth database adapter implementation
- ✅ Uses Strapi's document service for data management
- ✅ Supports all Better Auth core features (users, sessions, accounts, verification)
- ✅ All Better Auth endpoints available through Strapi API
- ✅ Works with Strapi v5+

## Installation

```bash
npm install @strapi-community/plugin-better-auth
# or
yarn add @strapi-community/plugin-better-auth
# or
pnpm add @strapi-community/plugin-better-auth
```

## Usage

### 1. Install the plugin in your Strapi application

Add the plugin to your Strapi plugins configuration:

```typescript
// config/plugins.ts
export default {
  'better-auth': {
    enabled: true,
  }
}
```

### 2. Customize the Better Auth options

The [Better Auth options](https://www.better-auth.com/docs/reference/options) can be customized through the plugin config:

```typescript
// config/plugins.ts
export default {
  'better-auth': {
    enabled: true,
    config: {
      betterAuthOptions: {
        emailAndPassword: {
          enabled: true,
          requireEmailVerification: true,
        },
        socialProviders: {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          },
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        },
        session: {
          expiresIn: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
  },
};
```

### 3. Client implementation

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

### 4. Server side authentication

Use the Better Auth session to authenticate your users in custom Strapi controllers.

```typescript
// In a Strapi controller
export default {
  async customMethod(ctx) {
    // Access the Better Auth instance
    // @ts-expect-error - Accessing custom property
    const auth = strapi.betterAuth;
    
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

Any Better Auth plugin may be used with Strapi + Better Auth, but only a subset are considered supported for the integration. Strapi + Better Auth works out of the box for these without any required schema changes.

| Plugin | Tested |
|-----------|-------------|
| Two Factor | ✅ |
| Username | ✅ |
| Anonymous | ❌ |
| Email OTP | ❌ |
| Generic OAuth | ❌ |
| JWT | ❌ |
| Magic Link | ❌ |
| One Tap | ❌ |
| Passkey | ❌ |
| Phone Number | ❌ |


## Resources

- [Better Auth Documentation](https://better-auth.com)
- [Better Auth Database Adapters](https://better-auth.com/docs/concepts/database)
- [Creating Custom Adapters](https://better-auth.com/docs/guides/create-a-db-adapter)
- [Strapi Documentation](https://docs.strapi.io)

## Authors

- [Boaz Poolman](https://github.com/boazpoolman)

## License

See the [LICENSE](./LICENSE.md) file for licensing information.