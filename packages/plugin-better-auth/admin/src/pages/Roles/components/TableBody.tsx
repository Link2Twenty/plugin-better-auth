import {
  Flex,
  IconButton,
  Link,
  Tbody,
  Td,
  Tr,
  Typography,
} from "@strapi/design-system";
import { Pencil, Trash } from "@strapi/icons";
import type React from "react";
import { useIntl } from "react-intl";

import { ROLES_BASE } from "../paths";

interface Role {
  id: number;
  name: string;
  description?: string;
  type: string;
  nb_users: number;
}

interface TableBodyProps {
  sortedRoles: Role[];
  canDelete?: boolean;
  canUpdate?: boolean;
  onDeleteClick: (id: string, name: string) => void;
}

const TableBody = ({
  sortedRoles,
  canDelete = false,
  canUpdate = false,
  onDeleteClick,
}: TableBodyProps) => {
  const { formatMessage } = useIntl();
  const goToEdit = (id: string) => {
    if (typeof window !== "undefined")
      window.location.href = `${ROLES_BASE}/${id}`;
  };

  const checkCanDeleteRole = (role: Role) =>
    canDelete && !["public", "authenticated"].includes(role.type);

  const handleClickDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    onDeleteClick(id, name);
  };

  return (
    <Tbody>
      {sortedRoles.map((role) => (
        <Tr
          key={role.id}
          cursor="pointer"
          onClick={() => goToEdit(role.id.toString())}
        >
          <Td width="20%">
            <Typography>{role.name}</Typography>
          </Td>
          <Td width="50%">
            <Typography>{role.description ?? ""}</Typography>
          </Td>
          <Td width="30%">
            <Typography>
              {formatMessage(
                {
                  id: "Roles.RoleRow.user-count",
                  defaultMessage:
                    "{number, plural, =0 {# user} one {# user} other {# users}}",
                },
                { number: role.nb_users ?? 0 },
              )}
            </Typography>
          </Td>
          <Td>
            <Flex justifyContent="end" onClick={(e) => e.stopPropagation()}>
              {canUpdate ? (
                <Link
                  href={`${ROLES_BASE}/${role.id}`}
                  aria-label={formatMessage(
                    {
                      id: "app.component.table.edit",
                      defaultMessage: "Edit {target}",
                    },
                    { target: role.name },
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Pencil />
                </Link>
              ) : null}
              {checkCanDeleteRole(role) && (
                <IconButton
                  onClick={(e) =>
                    handleClickDelete(e, role.id.toString(), role.name)
                  }
                  variant="ghost"
                  label={formatMessage(
                    {
                      id: "global.delete-target",
                      defaultMessage: "Delete {target}",
                    },
                    { target: role.name },
                  )}
                >
                  <Trash />
                </IconButton>
              )}
            </Flex>
          </Td>
        </Tr>
      ))}
    </Tbody>
  );
};

export default TableBody;
