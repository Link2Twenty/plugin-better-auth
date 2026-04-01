# Contributing to Strapi Auth

Thank you for your interest in contributing! This project is in early alpha, so contributions of all kinds — bug reports, feature ideas, documentation improvements, and code — are especially valuable.

## Getting started

### Prerequisites

- Node.js >= 22
- pnpm >= 10

### Setup

```bash
git clone https://github.com/strapi-community/auth.git
cd auth
pnpm install
pnpm build
pnpm dev
```

## Project structure

```
packages/
  plugin-better-auth/       # Better Auth database adapter for Strapi
  plugin-api-permissions/   # Content API RBAC (roles & permissions)
apps/
  playground/            # Development Strapi app
```

## Making changes

1. Fork the repository and create a branch from `main`.
2. Make your changes in the relevant package under `packages/`.
3. Add or update tests where appropriate.
4. Run the checks below before opening a pull request.

### Checks

```bash
# Type checking
pnpm check-types

# Linting
pnpm lint

# Integration tests
pnpm test:integration

# Integration tests (requires a build first)
pnpm build
pnpm test:e2e
```

## Pull requests

- Keep pull requests focused on a single concern.
- Describe *why* the change is needed, not just what it does.
- Reference any related issues with `Fixes #123` or `Closes #123`.
- All checks must pass before a PR can be merged.

## Reporting issues

Use the [GitHub issue tracker](https://github.com/strapi-community/auth/issues). Please search for an existing issue before opening a new one, and include:

- A clear description of the problem.
- Steps to reproduce it.
- The versions of Node.js, pnpm, and Strapi you are using.

## Code style

This project uses [Biome](https://biomejs.dev/) for formatting and linting. Run `pnpm lint` to auto-fix issues before committing.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE.md).
