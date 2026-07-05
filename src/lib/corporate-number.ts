export function hasCorporateNumberValue(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}
