import type { Core } from "@strapi/strapi";
import type { ParameterizedContext } from "koa";

const ROLE_UID = "plugin::api-permissions.role" as const;
const PERMISSION_UID = "plugin::api-permissions.permission" as const;

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

async function getRolePermissions(strapi: Core.Strapi, roleId: string | number): Promise<Array<{ action: string }>> {
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
    name: "content-api",
    authenticate: async (ctx: ParameterizedContext): Promise<AuthResult> => {
      try {
        const resolver = (
          strapi.plugin("api-permissions").service("api-permissions") as {
            getSessionResolver: () => (ctx: ParameterizedContext) => Promise<{
              userId?: string | number;
              roleId?: string | number;
            } | null>;
          }
        ).getSessionResolver();

        const sessionInfo = await resolver(ctx);

        let permissions: Array<{ action: string }>;

        if (sessionInfo?.roleId != null) {
          permissions = await getRolePermissions(strapi, sessionInfo.roleId);
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
          credentials: sessionInfo != null ? (ctx.state.user ?? sessionInfo) : null,
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
