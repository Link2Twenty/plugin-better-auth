import { Page } from "@strapi/strapi/admin";
import React from "react";
import { ProtectedRolesCreatePage } from "./CreatePage";
import { ProtectedRolesEditPage } from "./EditPage";
import { ProtectedRolesListPage } from "./ListPage";
import { ROLES_BASE } from "./paths";

const PERMISSIONS = {
  accessRoles: [
    { action: "plugin::better-auth.roles.create" as const, subject: null },
    { action: "plugin::better-auth.roles.read" as const, subject: null },
  ],
};

/**
 * Renders the appropriate sub-page based on the current path.
 * Uses window.location to avoid React Router context issues when the plugin
 * is loaded as a separate bundle.
 */
const Roles = () => {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const rolesBase = ROLES_BASE;
  const isCreate = path === `${rolesBase}/new` || path.endsWith("/roles/new");
  const editMatch = path.match(
    new RegExp(`${rolesBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^/]+)$`),
  );
  const editId = editMatch && editMatch[1] !== "new" ? editMatch[1] : null;

  return (
    <Page.Protect permissions={PERMISSIONS.accessRoles}>
      {isCreate && <ProtectedRolesCreatePage />}
      {editId && <ProtectedRolesEditPage id={editId} />}
      {!isCreate && !editId && <ProtectedRolesListPage />}
    </Page.Protect>
  );
};

export default Roles;
