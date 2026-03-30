export const PERMISSIONS = {
  accessRoles: [
    { action: "plugin::api-permissions.roles.create" as const, subject: null },
    { action: "plugin::api-permissions.roles.read" as const, subject: null },
  ],
  createRole: [{ action: "plugin::api-permissions.roles.create" as const, subject: null }],
  deleteRole: [{ action: "plugin::api-permissions.roles.delete" as const, subject: null }],
  readRoles: [{ action: "plugin::api-permissions.roles.read" as const, subject: null }],
  updateRole: [{ action: "plugin::api-permissions.roles.update" as const, subject: null }],
};
