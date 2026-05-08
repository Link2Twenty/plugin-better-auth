import { Combobox, ComboboxOption, Field } from "@strapi/design-system";
import type React from "react";
import { useState } from "react";
import { useQuery } from "react-query";
import { client } from "../client";

interface UserComboboxProps {
  label?: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (userId: string) => void;
  error?: string;
  required?: boolean;
}

export function UserCombobox({
  label = "User",
  hint,
  placeholder = "Search users by email or name…",
  value,
  onChange,
  error,
  required,
}: UserComboboxProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["user-combobox-search", search],
    queryFn: async () => {
      const whereClause = search
        ? JSON.stringify([
            { field: "email", operator: "contains", value: search },
          ])
        : undefined;

      const result = await client.dash.listUsers({
        query: {
          limit: 20,
          offset: 0,
          sortBy: "createdAt",
          sortOrder: "desc",
          ...(whereClause ? { where: whereClause } : {}),
        },
      });

      return result.data?.users ?? [];
    },
    keepPreviousData: true,
  });

  const users = data ?? [];

  return (
    <Field.Root hint={hint} error={error} style={{ width: "100%" }}>
      <Field.Label>{label}</Field.Label>
      <Combobox
        placeholder={placeholder}
        value={value}
        onChange={(val: string) => onChange(val)}
        onInputChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearch(e.target.value)
        }
        loading={isLoading}
        required={required}
      >
        {users.map((user) => (
          <ComboboxOption key={user.id} value={user.id}>
            {user.name} — {user.email}
          </ComboboxOption>
        ))}
      </Combobox>
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );
}
