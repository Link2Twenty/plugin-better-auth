import type { Modules } from "@strapi/strapi";
import type { ParameterizedContext } from "koa";
import type { ROLE_UID } from "../utils";

export type SessionResolverResult = {
  user: Modules.Documents.AnyDocument;
  roles: Modules.Documents.Document<typeof ROLE_UID>[];
} | null;

export type SessionResolver = (
  ctx: ParameterizedContext,
) => Promise<SessionResolverResult>;

export default () => {
  let sessionResolver: SessionResolver = async () => null;

  return {
    registerSessionResolver(fn: SessionResolver) {
      sessionResolver = fn;
    },

    getSessionResolver(): SessionResolver {
      return sessionResolver;
    },
  };
};
