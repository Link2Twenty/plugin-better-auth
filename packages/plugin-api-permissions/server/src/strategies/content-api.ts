import type { Core } from "@strapi/strapi";
import type { ParameterizedContext } from "koa";
import { getPluginService, PERMISSION_UID, ROLE_UID } from "../utils";

type StrapiAbility = { can: (action: string, subject: string) => boolean };

type AuthResult = {
  authenticated: boolean;
  credentials?: unknown;
  ability?: StrapiAbility;
  error?: string | null;
};

function toContentAPIPermissions(
  permissions: Array<{ action: string }>,
): Array<{ action: string }> {
  return permissions.map((p) => ({ action: p.action }));
}

async function getRolePermissions(
  strapi: Core.Strapi,
  roleId: string | number,
): Promise<Array<{ action: string }>> {
  const permissions = await strapi.documents(PERMISSION_UID).findMany({
    filters: { role: { id: roleId } },
  });
  return permissions
    .filter((p): p is typeof p & { action: string } => p.action != null)
    .map((p) => ({ action: p.action }));
}

async function getPublicRolePermissions(
  strapi: Core.Strapi,
): Promise<Array<{ action: string }>> {
  const publicRole = await strapi.documents(ROLE_UID).findFirst({
    filters: { type: "public" },
  });
  if (!publicRole) return [];
  return getRolePermissions(strapi, publicRole.id);
}

export default function createContentApiStrategy(strapi: Core.Strapi) {
  return {
    name: "content-api",
    authenticate: async (ctx: ParameterizedContext): Promise<AuthResult> => {
      try {
        const resolver = getPluginService("session").getSessionResolver();

        const sessionInfo = await resolver(ctx);

        const roles = sessionInfo?.roles;

        let permissions: Array<{ action: string }>;

        if (roles && roles.length > 0) {
          const rolePermissions = await Promise.all(
            roles.map((role) => getRolePermissions(strapi, role.id)),
          );
          permissions = rolePermissions.flat();
        } else {
          permissions = await getPublicRolePermissions(strapi);
        }

        const contentApiPermissions = toContentAPIPermissions(permissions);

        if (contentApiPermissions.length === 0) {
          return { authenticated: false };
        }

        const rawAbility =
          await strapi.contentAPI.permissions.engine.generateAbility(
            contentApiPermissions,
          );
        const ability: StrapiAbility = {
          can: (action) => rawAbility.can(action, "all"),
        };

        return {
          authenticated: true,
          credentials:
            sessionInfo != null ? (ctx.state.user ?? sessionInfo) : null,
          ability,
        };
      } catch {
        return { authenticated: false };
      }
    },
    verify: async (
      auth: { credentials: unknown; ability: StrapiAbility | undefined },
      config: { scope?: string | string[] },
    ): Promise<void> => {
      const { UnauthorizedError, ForbiddenError } = await import(
        "@strapi/utils"
      ).then((m) => m.errors);

      if (!config?.scope) {
        if (!auth.credentials) {
          throw new UnauthorizedError();
        }
        return;
      }

      if (!auth.ability) {
        throw new UnauthorizedError();
      }

      const scopes = Array.isArray(config.scope)
        ? config.scope
        : [config.scope];
      const ability = auth.ability;
      const isAllowed = scopes.every((scope) => ability!.can(scope, "all"));

      if (!isAllowed) {
        throw new ForbiddenError();
      }
    },
  };
}
