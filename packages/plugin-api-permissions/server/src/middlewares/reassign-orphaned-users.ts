import type { Modules } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { getUserUID, ROLE_UID } from "../utils";

const reassignOrphanedUsers: Modules.Documents.Middleware.Middleware = async (
  context,
  next,
) => {
  const { action, contentType } = context;

  // Only continue for the role content type
  if (contentType.uid !== ROLE_UID) {
    return next();
  }

  // Run this middleware only for specific actions.
  if (action !== "delete") {
    return next();
  }

  const params = context.params as Modules.Documents.ServiceParams<
    typeof ROLE_UID
  >["delete"];

  const publicRole = await strapi.documents(ROLE_UID).findFirst({
    filters: { type: "public" },
  });

  if (!publicRole) {
    throw new errors.ApplicationError("Public role not found");
  }

  if (params.documentId === publicRole.documentId) {
    throw new errors.ApplicationError("Cannot delete public role");
  }

  const role = await strapi.documents(ROLE_UID).findOne({
    documentId: params.documentId,
  });

  if (!role) {
    return next();
  }

  // Reassign users from the deleted role to the default (public) role
  const userService = strapi.documents(getUserUID());

  const users = await userService.findMany({
    filters: { roles: { documentId: params.documentId } },
  });

  for (const user of users) {
    await userService.update({
      documentId: user.documentId,
      data: { roles: { set: [publicRole.documentId] } },
    });
  }

  return next();
};

export default reassignOrphanedUsers;
