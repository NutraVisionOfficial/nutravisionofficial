export interface FoodProduct {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  nutriScore: "A" | "B" | "C" | "D" | "E" | "unknown";
  imageUrl?: string;
  barcode: string;
}

function sanitizeString(val: unknown, maxLen = 200): string {
  if (typeof val !== "string") return "";
  return val.replace(/<[^>]*>/g, "").substring(0, maxLen).trim();
}

function clampNumber(val: unknown, min = 0, max = 99999): number {
  const n = Number(val);
  if (isNaN(n)) return 0;
  return Math.round(Math.max(min, Math.min(max, n)));
}

export async function fetchProductByBarcode(barcode: string): Promise<FoodProduct> {
  // Validate barcode format (digits only, 8-14 chars)
  if (!/^\d{8,14}$/.test(barcode)) {
    throw new Error("Invalid barcode format.");
  }

  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
  );

  if (!res.ok) {
    throw new Error("Network error while fetching product data.");
  }

  const data = await res.json();

  if (data.status !== 1 || !data.product) {
    throw new Error("Product not found in database.");
  }

  const p = data.product;
  const n = p.nutriments || {};

  const calories =
    n["energy-kcal_serving"] ?? n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0;
  const protein =
    n["proteins_serving"] ?? n["proteins_100g"] ?? n["proteins"] ?? 0;
  const carbs =
    n["carbohydrates_serving"] ?? n["carbohydrates_100g"] ?? n["carbohydrates"] ?? 0;
  const fats =
    n["fat_serving"] ?? n["fat_100g"] ?? n["fat"] ?? 0;

  const gradeRaw = (typeof p.nutriscore_grade === "string" ? p.nutriscore_grade : typeof p.nutrition_grades === "string" ? p.nutrition_grades : "").toUpperCase();
  const nutriScore = ["A", "B", "C", "D", "E"].includes(gradeRaw)
    ? (gradeRaw as FoodProduct["nutriScore"])
    : "unknown";

  return {
    name: sanitizeString(p.product_name || p.product_name_en) || "Unknown Product",
    calories: clampNumber(calories, 0, 10000),
    protein: clampNumber(protein, 0, 1000),
    carbs: clampNumber(carbs, 0, 1000),
    fats: clampNumber(fats, 0, 1000),
    nutriScore,
    imageUrl: typeof p.image_front_thumb_url === "string" ? p.image_front_thumb_url : typeof p.image_front_small_url === "string" ? p.image_front_small_url : undefined,
    barcode,
  };
}
