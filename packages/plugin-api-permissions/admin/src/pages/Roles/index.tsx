import { Page } from "@strapi/strapi/admin";
import React from "react";
import { ProtectedRolesCreatePage } from "./CreatePage";
import { ProtectedRolesEditPage } from "./EditPage";
import { ProtectedRolesListPage } from "./ListPage";
import { PERMISSIONS } from "./constants";
import { ROLES_BASE } from "./paths";

const Roles = () => {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const isCreate = path === `${ROLES_BASE}/new` || path.endsWith("/roles/new");
  const editMatch = path.match(
    new RegExp(`${ROLES_BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^/]+)$`),
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
