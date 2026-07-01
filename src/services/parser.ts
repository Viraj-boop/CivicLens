// XLSX parsing service — the seam where the real WA Vendor Payments file plugs in.
// The synthetic generator ships today; swapping in a real XLSX only touches THIS file.
// Every downstream consumer imports `getDataset()` and never cares about the source.

import type { VendorPayment } from "@/types/spending";
import { generateDataset } from "@/data/generateDataset";

let cache: VendorPayment[] | null = null;

/**
 * Returns the full vendor payments dataset. Memoized after first load.
 *
 * Future integration path (documented in README under "Trade-offs"):
 *   1. `bun add xlsx` (deferred to keep initial bundle lean).
 *   2. Replace `generateDataset()` with an fetch → SheetJS parse → schema-validate pipeline.
 *   3. Consumers do not change; the return type is the contract.
 */
export async function getDataset(): Promise<VendorPayment[]> {
  if (cache) return cache;
  // Simulate async so future swap-in has an identical signature.
  cache = await Promise.resolve(generateDataset());
  return cache;
}

/** Escape hatch for tests / re-seeding. */
export function __resetDatasetCache() {
  cache = null;
}
