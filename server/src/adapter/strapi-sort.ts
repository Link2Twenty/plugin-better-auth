/**
 * Convert Better Auth sortBy to Strapi sort format
 * Better Auth format: { field: 'createdAt', direction: 'desc' }
 * Strapi format: 'field:asc' or 'field:desc' or ['field1:asc', 'field2:desc']
 */
export const buildStrapiSort = (
  sortBy: { field: string; direction: "asc" | "desc" },
  model: string,
  getFieldName: (args: { model: string; field: string }) => string,
) => {
  if (!sortBy) {
    return undefined;
  }

  // Handle object format: { field: 'createdAt', direction: 'desc' }
  if (
    typeof sortBy === "object" &&
    !Array.isArray(sortBy) &&
    sortBy.field &&
    sortBy.direction
  ) {
    const fieldName = getFieldName({ model, field: sortBy.field });
    return `${fieldName}:${sortBy.direction}`;
  }

  // Handle array format: [{ field: 'createdAt', direction: 'desc' }, { field: 'name', direction: 'asc' }]
  if (Array.isArray(sortBy)) {
    if (sortBy.length === 0) {
      return undefined;
    }

    const sortStrings = sortBy
      .map((item) => {
        if (item.field && item.direction) {
          const fieldName = getFieldName({ model, field: item.field });
          return `${fieldName}:${item.direction}`;
        }
        return null;
      })
      .filter(Boolean);

    return sortStrings.length === 1 ? sortStrings[0] : sortStrings;
  }

  return sortBy;
};
