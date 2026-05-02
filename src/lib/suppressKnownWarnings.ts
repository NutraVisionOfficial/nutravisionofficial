/**
 * Dev-only suppression of known false-positive React warnings from
 * third-party libraries that we can't fix without an upstream update.
 *
 * Currently filters:
 *  - Recharts 2.x: "Function components cannot be given refs" warnings
 *    triggered internally by Recharts when it clones chart children
 *    (CartesianGrid, XAxis, YAxis, Tooltip, etc.). These are harmless
 *    and fixed in Recharts v3.
 */
if (import.meta.env.DEV) {
  const RECHARTS_INTERNAL_COMPONENTS = [
    "CartesianGrid",
    "XAxis",
    "YAxis",
    "Tooltip",
    "Legend",
    "Bar",
    "Line",
    "Area",
    "Cell",
    "ReferenceLine",
    "ResponsiveContainer",
  ];

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string" && first.includes("Function components cannot be given refs")) {
      const joined = args.map((a) => (typeof a === "string" ? a : "")).join(" ");
      if (
        joined.includes("recharts") ||
        RECHARTS_INTERNAL_COMPONENTS.some((c) => joined.includes(`render method of \`${c}\``))
      ) {
        return;
      }
    }
    originalError(...args);
  };
}
