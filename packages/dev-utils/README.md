# @strapi-community/dev-utils

Internal dev tooling for the `plugin-better-auth` monorepo. Not published to npm.

## What's inside

### Binaries

| Binary | Description |
| ------ | ----------- |
| `dev-strapi` | Starts the playground Strapi app in dev mode and watches `packages/` and `plugins/` for compiled output changes, automatically restarting on rebuild |
| `with-db` | Starts the required Docker Compose service for `DATABASE_CLIENT` (postgres or mysql), exports connection env vars, runs the given command, then stops the service on exit |

### TypeScript API

Imported via `@strapi-community/dev-utils` in test files.

#### `setupStrapi()`

Boots a full Strapi instance against the playground app for use in Vitest integration tests. Picks a free port per worker thread so parallel test files don't collide. Respects `DATABASE_CLIENT` and related env vars for the database backend.

#### `stopStrapi()`

Destroys the running Strapi instance and cleans up any temporary SQLite database file created by `setupStrapi`.

#### `createPlaywrightConfig(options)`

Returns a Playwright `defineConfig` preconfigured for this monorepo — starts the playground as a web server, sets up the `setup` / `teardown` / `chromium` project structure, and handles per-process SQLite filenames for sqlite or passes through connection env vars for postgres/mysql.

#### `registerAuthSetup(authFilePath)`

Playwright setup step that registers the Strapi admin account and saves storage state to `authFilePath`.

#### `registerDbTeardown(playgroundDirPath)`

Playwright teardown step that deletes the temporary SQLite database file after a test run.

#### `cleanupDir(dir)`

Removes all contents of a directory except a `build/` subfolder. Used between test runs to reset playground state.

#### `getFreePort()`

Returns a free TCP port on `127.0.0.1`, used internally by `setupStrapi`.

## Usage

### `dev-strapi`

Run from the playground (or via `pnpm dev` at the root):

```bash
pnpm dev                  # SQLite
pnpm dev:postgres         # Postgres (starts Docker automatically)
pnpm dev:mysql            # MySQL (starts Docker automatically)
```

### `with-db`

Wrap any command to spin up a database service first:

```bash
DATABASE_CLIENT=postgres with-db <command>
DATABASE_CLIENT=mysql    with-db <command>
```

Set `WITH_DB_SKIP_DOCKER=1` to skip Docker (useful when a database is already running).

### Integration tests

```ts
import { setupStrapi, stopStrapi } from "@strapi-community/dev-utils";

beforeAll(setupStrapi);
afterAll(stopStrapi);
```

### E2e tests (Playwright)

```ts
// playwright.config.ts
import { createPlaywrightConfig } from "@strapi-community/dev-utils";
export default createPlaywrightConfig({ testDir: "./admin/test" });

// setup/auth.setup.ts
import { registerAuthSetup } from "@strapi-community/dev-utils";
registerAuthSetup(`${__dirname}/../.auth/user.json`);

// teardown/db.teardown.ts
import { registerDbTeardown } from "@strapi-community/dev-utils";
registerDbTeardown(path.resolve(__dirname, "../../../../../apps/playground"));
```

## Docker Compose

`with-db` uses the `docker-compose.yml` in this package to manage Postgres and MySQL services.
