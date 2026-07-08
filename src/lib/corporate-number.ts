import { normalizeCorporateNumber } from "@/lib/etl/normalize";

export function hasCorporateNumberValue(value: string | null | undefined): value is string {
  return normalizeCorporateNumber(value) != null;
}
