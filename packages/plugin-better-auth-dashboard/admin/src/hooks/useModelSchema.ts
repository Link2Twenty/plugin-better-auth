import { useQuery } from "react-query";
import { getAuthHeaders } from "../client";

export interface StrapiAttribute {
  type: string;
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  enum?: string[];
  target?: string;
  relation?: string;
  component?: string;
  repeatable?: boolean;
  pluginOptions?: Record<string, unknown>;
  [key: string]: unknown;
}

export type ModelSchema = Record<string, StrapiAttribute>;

async function fetchModelSchema(model: string): Promise<ModelSchema> {
  const headers = getAuthHeaders();
  const res = await fetch(`/admin/better-auth-dashboard/schema/${model}`, {
    headers: headers as Record<string, string>,
  });
  if (!res.ok) throw new Error("Failed to fetch schema");
  const json = (await res.json()) as { attributes: ModelSchema };
  return json.attributes;
}

export function useModelSchema(model: "user" | "organization") {
  return useQuery<ModelSchema, Error>({
    queryKey: ["ba-model-schema", model],
    queryFn: () => fetchModelSchema(model),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
