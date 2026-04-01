interface RecursiveRecordOfBooleans {
  [key: string]: boolean | RecursiveRecordOfBooleans;
}

function getLeafValues(obj: unknown): boolean[] {
  if (obj === null || obj === undefined) {
    return [];
  }
  if (typeof obj === "boolean") {
    return [obj];
  }
  if (typeof obj === "object" && !Array.isArray(obj)) {
    return Object.values(obj).flatMap(getLeafValues);
  }
  return [];
}

export function getCheckboxState(
  dataObj: RecursiveRecordOfBooleans | null | undefined,
): {
  hasAllActionsSelected: boolean;
  hasSomeActionsSelected: boolean;
} {
  const arrayOfValues = getLeafValues(dataObj);

  if (!arrayOfValues.length) {
    return { hasAllActionsSelected: false, hasSomeActionsSelected: false };
  }

  const hasAllActionsSelected = arrayOfValues.every((val) => val);
  const hasSomeActionsSelected =
    arrayOfValues.some((val) => val) && !hasAllActionsSelected;

  return { hasAllActionsSelected, hasSomeActionsSelected };
}
