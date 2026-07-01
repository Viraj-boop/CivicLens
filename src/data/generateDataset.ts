// Deterministic synthetic Washington State vendor payments.
// The schema mirrors the WA public XLSX exactly — the real file can be swapped in
// via `src/services/parser.ts` without touching any consumer.

import type { VendorPayment } from "@/types/spending";

const AGENCIES = [
  "Department of Transportation",
  "Department of Health",
  "Department of Social & Health Services",
  "Department of Ecology",
  "Department of Corrections",
  "Department of Natural Resources",
  "Department of Labor & Industries",
  "Department of Commerce",
  "Office of the Superintendent of Public Instruction",
  "Department of Enterprise Services",
];

const VENDORS = [
  "Kiewit Infrastructure Co.",
  "Boeing Aerospace Operations",
  "CH2M Hill Engineers",
  "Microsoft Corporation",
  "Skanska USA Civil West",
  "Granite Construction",
  "Deloitte Consulting LLP",
  "Accenture LLP",
  "Sound Transit",
  "Puget Sound Energy",
  "Kaiser Foundation Health Plan",
  "Molina Healthcare",
  "Amazon Web Services",
  "T-Mobile USA",
  "Weyerhaeuser Company",
  "Cascade Natural Gas",
  "Aramark Correctional Services",
  "Regence BlueShield",
  "Providence Health & Services",
  "GEO Group Inc.",
  "Bechtel National Inc.",
  "Parsons Transportation Group",
  "Jacobs Engineering",
  "Northrop Grumman",
  "Peterson Systems",
];

const CATEGORIES = [
  "Construction & Infrastructure",
  "Healthcare Services",
  "Professional Services",
  "Technology & Software",
  "Utilities",
  "Facilities & Maintenance",
  "Transportation",
  "Education Services",
  "Environmental Services",
  "Public Safety",
];

const DESCRIPTIONS: Record<string, string[]> = {
  "Construction & Infrastructure": ["Highway resurfacing contract", "Bridge structural repair", "State facility construction"],
  "Healthcare Services": ["Medicaid managed care payments", "Public health services", "Behavioral health support"],
  "Professional Services": ["Management consulting", "Legal advisory services", "Actuarial analysis"],
  "Technology & Software": ["Cloud infrastructure", "Enterprise software licensing", "IT modernization"],
  "Utilities": ["Electricity supply", "Natural gas service", "Telecommunications"],
  "Facilities & Maintenance": ["Custodial services", "HVAC maintenance", "Grounds keeping"],
  "Transportation": ["Fleet leasing", "Fuel purchase", "Public transit subsidy"],
  "Education Services": ["Curriculum development", "Assessment services", "Teacher training"],
  "Environmental Services": ["Water quality monitoring", "Habitat restoration", "Air quality studies"],
  "Public Safety": ["Correctional food services", "Security equipment", "Emergency response systems"],
};

// Small, deterministic PRNG (Mulberry32) — dataset is reproducible across builds.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FISCAL_YEARS = [2020, 2021, 2022, 2023, 2024];

export function generateDataset(seed = 42, rowsPerYear = 500): VendorPayment[] {
  const rand = mulberry32(seed);
  const rows: VendorPayment[] = [];

  for (const fy of FISCAL_YEARS) {
    // Year-over-year growth trend for realism.
    const yearMultiplier = 1 + (fy - 2020) * 0.06;

    for (let i = 0; i < rowsPerYear; i++) {
      const agency = AGENCIES[Math.floor(rand() * AGENCIES.length)];
      const category = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
      const vendor = VENDORS[Math.floor(rand() * VENDORS.length)];
      const descs = DESCRIPTIONS[category];
      const description = descs[Math.floor(rand() * descs.length)];

      // Log-normal-ish payment distribution: many small, few huge.
      const base = Math.exp(rand() * 6 + 8); // ~$3K to ~$60M
      const amount = Math.round(base * yearMultiplier);

      // Random date within fiscal year (July → June).
      const month = Math.floor(rand() * 12);
      const day = Math.floor(rand() * 28) + 1;
      const calYear = month >= 6 ? fy - 1 : fy;
      const paymentDate = new Date(calYear, month, day).toISOString().slice(0, 10);

      rows.push({
        id: `${fy}-${i}`,
        fiscalYear: fy,
        agency,
        vendor,
        category,
        paymentDate,
        amount,
        description,
      });
    }
  }

  // Inject a few anomalously large payments for the "unusual payments" intent.
  for (let i = 0; i < 8; i++) {
    const fy = FISCAL_YEARS[Math.floor(rand() * FISCAL_YEARS.length)];
    rows.push({
      id: `anomaly-${i}`,
      fiscalYear: fy,
      agency: AGENCIES[Math.floor(rand() * AGENCIES.length)],
      vendor: VENDORS[Math.floor(rand() * VENDORS.length)],
      category: CATEGORIES[Math.floor(rand() * CATEGORIES.length)],
      paymentDate: `${fy - 1}-08-15`,
      amount: Math.round(80_000_000 + rand() * 120_000_000),
      description: "Multi-year contract disbursement",
    });
  }

  return rows;
}
