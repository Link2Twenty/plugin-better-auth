import type { Modules, Data } from '@strapi/strapi';
import { getUserUID, ROLE_UID } from '../utils';

const addUserCount = async (role: Data.ContentType<typeof ROLE_UID>) => {
  let nb_users = 0;

  const userService = strapi.documents(getUserUID());
  nb_users = await userService.count({
    filters: { roles: { documentId: role.documentId } },
  });

  // @ts-expect-error - This is a virtual field, so it won't be defined in the type system
  role.nb_users = nb_users;

  return role;
};

const includeUserCount: Modules.Documents.Middleware.Middleware = async (context, next) => {
  const { action, contentType } = context;

  // Only continue for the role content type
  if (contentType.uid !== ROLE_UID) {
    return next();
  }

  // Run this middleware only for specific actions.
  if (!['findOne', 'findMany', 'findFirst'].includes(action)) {
    return next();
  }

  const response = await next();

  if (Array.isArray(response)) {
    await Promise.all(response.map(async (role) => {
      return addUserCount(role);
    }));

    return response;
  }

  if (!response) {
    return response;
  }

  return addUserCount(response as Data.ContentType<typeof ROLE_UID>);
};

export default includeUserCount;
