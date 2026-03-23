import type { Core } from "@strapi/strapi";
import type { ParameterizedContext } from "koa";
import { fromNodeHeaders } from "better-auth/node";

const ROLE_UID = "plugin::better-auth.role" as const;
const PERMISSION_UID = "plugin::better-auth.permission" as const;
const USER_UID = "plugin::better-auth.user" as const;

type AuthResult = {
  authenticated: boolean;
  credentials?: unknown;
  ability?: unknown;
  error?: string | null;
};

function toContentAPIPermissions(
  permissions: Array<{ action: string }>
): Array<{ action: string }> {
  return permissions.map((p) => ({ action: p.action }));
}

async function getRolePermissions(strapi: Core.Strapi, roleId: number): Promise<Array<{ action: string }>> {
  const permissions = await strapi.db.query(PERMISSION_UID).findMany({
    where: { role: { id: roleId } },
  });
  return (permissions as Array<{ action: string }>).map((p) => ({ action: p.action }));
}

async function getPublicRolePermissions(strapi: Core.Strapi): Promise<Array<{ action: string }>> {
  const publicRole = await strapi.db.query(ROLE_UID).findOne({
    where: { type: "public" },
  });
  if (!publicRole) return [];
  return getRolePermissions(strapi, publicRole.id as number);
}

export default function createContentApiStrategy(strapi: Core.Strapi) {
  return {
    name: "better-auth",
    authenticate: async (ctx: ParameterizedContext): Promise<AuthResult> => {
      try {
        const authConfig = (strapi as unknown as { internal_config: Record<string, unknown> }).internal_config["better-auth"] as
          | { api?: { getSession?: (opts: { headers: Headers }) => Promise<{ user?: { id: string }; session?: unknown } | null> } }
          | (() => { api?: { getSession?: (opts: { headers: Headers }) => Promise<{ user?: { id: string }; session?: unknown } | null> } })
          | undefined;

        const auth = typeof authConfig === "function" ? authConfig() : authConfig;

        if (!auth?.api?.getSession) {
          return { authenticated: false };
        }

        const headers = fromNodeHeaders(ctx.request.headers as Record<string, string | string[] | undefined>);
        const session = await auth.api.getSession({ headers });

        let permissions: Array<{ action: string }>;

        if (session?.user?.id != null) {
          const userId = typeof session.user.id === "string" ? Number(session.user.id) : session.user.id;
          const user = await strapi.db.query(USER_UID).findOne({
            where: { id: userId },
            populate: ["role"],
          });

          if (!user) {
            return { authenticated: false };
          }

          const role = (user as { role?: { id: number } }).role;
          if (!role?.id) {
            permissions = await getPublicRolePermissions(strapi);
          } else {
            permissions = await getRolePermissions(strapi, role.id);
          }

          ctx.state.user = user;
        } else {
          permissions = await getPublicRolePermissions(strapi);
        }

        const contentApiPermissions = toContentAPIPermissions(permissions);

        if (contentApiPermissions.length === 0) {
          return { authenticated: false };
        }

        const ability = await strapi.contentAPI.permissions.engine.generateAbility(contentApiPermissions);

        return {
          authenticated: true,
          credentials: session?.user ? ctx.state.user : null,
          ability,
        };
      } catch {
        return { authenticated: false };
      }
    },
    verify: async (
      auth: { credentials: unknown; ability: unknown },
      config: { scope?: string | string[] }
    ): Promise<void> => {
      const { UnauthorizedError, ForbiddenError } = await import("@strapi/utils").then((m) => m.errors);

      if (!config?.scope) {
        if (!auth.credentials) {
          throw new UnauthorizedError();
        }
        return;
      }

      if (!auth.ability) {
        throw new UnauthorizedError();
      }

      const scopes = Array.isArray(config.scope) ? config.scope : [config.scope];
      const ability = auth.ability as { can: (action: string) => boolean };
      const isAllowed = scopes.every((scope) => ability.can(scope));

      if (!isAllowed) {
        throw new ForbiddenError();
      }
    },
  };
}
