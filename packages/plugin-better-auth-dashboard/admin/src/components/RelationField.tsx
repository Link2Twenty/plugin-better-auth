import {
  Combobox,
  ComboboxOption,
  Field,
  Flex,
  IconButton,
  Typography,
} from "@strapi/design-system";
import { Trash } from "@strapi/icons";
import { useFetchClient } from "@strapi/strapi/admin";
import type React from "react";
import { useRef, useState } from "react";
import { useQuery } from "react-query";
import styled from "styled-components";
import type { StrapiAttribute } from "../hooks/useModelSchema";

const EntryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid ${({ theme }) => (theme as Record<string, Record<string, string>>).colors?.neutral200 ?? "#dcdce4"};
  border-radius: 4px;
  min-width: 0;
`;

function getDisplayLabel(doc: Record<string, unknown>): string {
  for (const key of ["name", "title", "email", "username", "label", "slug"]) {
    const v = doc[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return String(doc.documentId ?? doc.id ?? "");
}

interface SelectedDoc {
  documentId: string;
  label: string;
}

function normalizeValue(val: unknown, cache: Map<string, string>): SelectedDoc[] {
  if (!val) return [];

  // Strapi Document Service set-format written by this component on change
  if (
    typeof val === "object" &&
    !Array.isArray(val) &&
    val !== null &&
    "set" in val
  ) {
    const items = ((val as { set?: unknown[] }).set ?? []) as Array<{
      documentId?: string;
    }>;
    return items
      .filter((item) => item?.documentId)
      .map((item) => ({
        documentId: item.documentId!,
        label: cache.get(item.documentId!) ?? item.documentId!,
      }));
  }

  // Populated document(s) returned by the db-controller
  const items = Array.isArray(val) ? val : [val];
  return (items as unknown[])
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && "documentId" in item,
    )
    .map((item) => ({
      documentId: String(item.documentId),
      label: getDisplayLabel(item),
    }));
}

export interface RelationFieldProps {
  name: string;
  label: string;
  attribute: StrapiAttribute;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  readOnly?: boolean;
}

export function RelationField({
  name,
  label,
  attribute,
  value,
  onChange,
  readOnly = false,
}: RelationFieldProps) {
  const { get } = useFetchClient();
  const cache = useRef(new Map<string, string>());
  const [search, setSearch] = useState("");
  // Key trick: remount the "add" combobox after each selection to clear its input
  const [addKey, setAddKey] = useState(0);

  const target = attribute.target ?? "";
  const relationType = attribute.relation ?? "manyToOne";
  const isMulti = relationType === "oneToMany" || relationType === "manyToMany";

  const currentDocs = normalizeValue(value, cache.current);
  const selectedIds = new Set(currentDocs.map((d) => d.documentId));

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["relation-search", target, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        uid: target,
        "pagination[pageSize]": "50",
      });
      if (search) params.set("filters[name][$containsi]", search);

      const { data } = await get<{ results: Record<string, unknown>[] }>(
        `/better-auth-dashboard/db?${params}`,
      );
      const docs =
        (data as { results?: Record<string, unknown>[] }).results ?? [];

      for (const doc of docs) {
        if (doc.documentId) {
          cache.current.set(String(doc.documentId), getDisplayLabel(doc));
        }
      }

      return docs
        .map((doc) => ({
          documentId: String(doc.documentId ?? ""),
          label: getDisplayLabel(doc),
        }))
        .filter((d) => d.documentId);
    },
    keepPreviousData: true,
    enabled: !readOnly,
  });

  // Exclude already-selected from the dropdown for both single and multi
  const availableOptions = searchResults.filter(
    (r) => !selectedIds.has(r.documentId),
  );

  const commit = (ids: string[]) => {
    onChange(name, { set: ids.map((id) => ({ documentId: id })) });
  };

  const handleSelect = (val: string) => {
    if (!val) return;
    const opt = searchResults.find((r) => r.documentId === val);
    if (opt) cache.current.set(val, opt.label);
    if (isMulti) {
      if (selectedIds.has(val)) return;
      commit([...currentDocs.map((d) => d.documentId), val]);
    } else {
      commit([val]);
    }
    setSearch("");
    setAddKey((k) => k + 1);
  };

  const handleRemove = (docId: string) => {
    commit(
      currentDocs
        .filter((d) => d.documentId !== docId)
        .map((d) => d.documentId),
    );
  };

  return (
    <Field.Root style={{ width: "100%" }}>
      <Field.Label>{label}</Field.Label>
      {!readOnly && (
        <Combobox
          key={addKey}
          value=""
          onChange={(val: string) => handleSelect(val)}
          onInputChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          loading={isLoading}
          placeholder="Search…"
        >
          {availableOptions.map((opt) => (
            <ComboboxOption key={opt.documentId} value={opt.documentId}>
              {opt.label}
            </ComboboxOption>
          ))}
        </Combobox>
      )}
      {currentDocs.length > 0 && (
        <Flex direction="column" gap={1} style={{ marginTop: 8, width: "100%" }}>
          {currentDocs.map((doc) => (
            <EntryRow key={doc.documentId}>
              <Typography
                variant="omega"
                textColor="neutral800"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {doc.label}
              </Typography>
              {!readOnly && (
                <IconButton
                  label="Remove"
                  size="S"
                  onClick={() => handleRemove(doc.documentId)}
                >
                  <Trash />
                </IconButton>
              )}
            </EntryRow>
          ))}
        </Flex>
      )}
    </Field.Root>
  );
}
