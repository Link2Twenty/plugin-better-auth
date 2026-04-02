---
id: intro
title: Introduction
sidebar_position: 1
---

# Strapi Auth

A collection of Strapi v5 plugins that bring [Better Auth](https://better-auth.com) authentication and fine-grained Content API permissions to your Strapi application.

:::caution Alpha Software
Both plugins are in **ALPHA** state. They are not considered stable and should not be used in production. If you want to contribute, please contact the maintainers.
:::

## Packages

### [@strapi-community/plugin-better-auth](./plugin-better-auth)

A [Better Auth](https://better-auth.com) database adapter that uses Strapi as the database backend. It exposes all Better Auth API endpoints through Strapi's API and wires the authentication system directly into Strapi's document service.

**When to use it:** You want to add email/password, OAuth, magic link, or any other Better Auth-supported authentication flow to a Strapi v5 application.

### [@strapi-community/plugin-api-permissions](./plugin-api-permissions)

Content API RBAC (role-based access control) for Strapi — auth-provider agnostic. It gives you a role management UI in the Strapi admin panel and a pluggable session resolver interface so any authentication provider can drive your Content API access control.

**When to use it:** You want fine-grained, role-based permissions on Strapi's Content API without relying on the built-in Users & Permissions plugin.

## How they work together

The two plugins are designed to complement each other but can be used independently:

- Use **plugin-better-auth** alone if you only need authentication and manage permissions yourself.
- Use **plugin-api-permissions** alone if you already have an auth provider and just need RBAC on the Content API.
- Use **both** for a fully integrated solution: Better Auth handles authentication while plugin-api-permissions handles authorization. When both are installed, the session resolver is wired up automatically — no extra configuration required.

See [Using Both Plugins Together](./integration) for the full setup guide.

## Requirements

- Node.js >= 20
- Strapi v5 (experimental)
- `better-auth >= 1.4.0` (only required for plugin-better-auth)
