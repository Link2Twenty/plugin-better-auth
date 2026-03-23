export const PERMISSIONS = {
  accessRoles: [
    { action: "plugin::better-auth.roles.create" as const, subject: null },
    { action: "plugin::better-auth.roles.read" as const, subject: null },
  ],
  createRole: [{ action: "plugin::better-auth.roles.create" as const, subject: null }],
  deleteRole: [{ action: "plugin::better-auth.roles.delete" as const, subject: null }],
  readRoles: [{ action: "plugin::better-auth.roles.read" as const, subject: null }],
  updateRole: [{ action: "plugin::better-auth.roles.update" as const, subject: null }],
};
