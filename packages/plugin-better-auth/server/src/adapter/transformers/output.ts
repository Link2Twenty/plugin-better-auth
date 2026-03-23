const ISO_DATETIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function coerceDateString(value: string): string | Date {
  if (!ISO_DATETIME_REGEX.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}

function coerceDateValues<T>(value: T): T {
  if (typeof value === "string") {
    return coerceDateString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => coerceDateValues(item)) as T;
  }

  if (!value || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  const coerced = Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      coerceDateValues(nestedValue),
    ]),
  );

  return coerced as T;
}

export function transformOutput<T>(record: any): T {
  // For now, we only need to coerce date values, but this is where any future output transformations would go.
  return coerceDateValues(record);
}
