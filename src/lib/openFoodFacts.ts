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

export async function fetchProductByBarcode(barcode: string): Promise<FoodProduct> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
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

  const gradeRaw = (p.nutriscore_grade || p.nutrition_grades || "").toUpperCase();
  const nutriScore = ["A", "B", "C", "D", "E"].includes(gradeRaw)
    ? (gradeRaw as FoodProduct["nutriScore"])
    : "unknown";

  return {
    name: p.product_name || p.product_name_en || "Unknown Product",
    calories: Math.round(Number(calories)),
    protein: Math.round(Number(protein)),
    carbs: Math.round(Number(carbs)),
    fats: Math.round(Number(fats)),
    nutriScore,
    imageUrl: p.image_front_thumb_url || p.image_front_small_url || undefined,
    barcode,
  };
}
