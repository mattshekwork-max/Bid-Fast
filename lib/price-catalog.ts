// Built-in reference prices for EQUIPMENT / MATERIALS (not installed — labor is
// estimated separately). These give the AI real unit costs for items LLMs
// chronically lowball or omit. A contractor's own price_book entries override
// these by (case-insensitive) item name.

export type CatalogItem = { item: string; unit: string; price: number; note?: string };

export const DEFAULT_CATALOG: CatalogItem[] = [
  // Solar / battery / electrical
  { item: "Tesla Powerwall battery", unit: "each", price: 9500, note: "battery unit only" },
  { item: "Solar panel (residential ~400W)", unit: "each", price: 300 },
  { item: "String inverter (up to 7.6kW)", unit: "each", price: 2200 },
  { item: "Microinverter", unit: "each", price: 200, note: "per panel" },
  { item: "Solar mounting/racking", unit: "panel", price: 70 },
  { item: "200A main panel upgrade", unit: "each", price: 2500, note: "panel + gear, excl. labor" },
  { item: "EV charger (Level 2)", unit: "each", price: 650 },
  { item: "Standby generator (22kW)", unit: "each", price: 5500 },
  { item: "Solar permit & interconnection", unit: "job", price: 1500 },

  // HVAC
  { item: "Central AC condenser (3 ton)", unit: "each", price: 3200 },
  { item: "Gas furnace (80k BTU)", unit: "each", price: 2200 },
  { item: "Heat pump (3 ton)", unit: "each", price: 4800 },
  { item: "Mini-split (single zone)", unit: "each", price: 1800 },
  { item: "Tankless water heater", unit: "each", price: 1400 },
  { item: "Water heater (50 gal tank)", unit: "each", price: 700 },

  // Roofing
  { item: "Architectural shingles", unit: "square", price: 130, note: "materials per 100 sq ft" },
  { item: "Synthetic underlayment", unit: "square", price: 22 },
  { item: "Drip edge / flashing", unit: "linear ft", price: 3 },
  { item: "Ridge vent", unit: "linear ft", price: 9 },

  // Kitchen / bath
  { item: "Quartz countertop", unit: "sq ft", price: 75, note: "material" },
  { item: "Semi-custom cabinets", unit: "linear ft", price: 350 },
  { item: "Toilet", unit: "each", price: 300 },
  { item: "Vanity (36in)", unit: "each", price: 700 },
  { item: "LVP flooring", unit: "sq ft", price: 4 },
  { item: "Tile (ceramic/porcelain)", unit: "sq ft", price: 6 },

  // General
  { item: "Dumpster / haul-off", unit: "job", price: 600 },
  { item: "Building permit (typical residential)", unit: "job", price: 800 },
];

/**
 * Build a compact reference block for the AI prompt, merging the built-in
 * catalog with the contractor's custom prices (custom overrides by name).
 */
export function buildPriceReference(
  custom: { item_name: string; unit: string; unit_price: number }[] = []
): string {
  const merged = new Map<string, CatalogItem>();
  for (const c of DEFAULT_CATALOG) merged.set(c.item.toLowerCase(), c);
  for (const c of custom) {
    if (!c.item_name) continue;
    merged.set(c.item_name.toLowerCase(), { item: c.item_name, unit: c.unit || "each", price: Number(c.unit_price) || 0 });
  }
  const lines = [...merged.values()]
    .filter((c) => c.price > 0)
    .map((c) => `- ${c.item}: $${c.price} per ${c.unit}${c.note ? ` (${c.note})` : ""}`);
  return lines.join("\n");
}
