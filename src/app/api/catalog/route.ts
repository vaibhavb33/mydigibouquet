import { NextResponse } from "next/server";
import { CATALOG_ENTRIES } from "@/generated/catalog-manifest";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const role = searchParams.get("role");
  const color = searchParams.get("color");
  const occasion = searchParams.get("occasion");

  const items = CATALOG_ENTRIES.filter((item) => {
    if (role && role !== "all" && item.role !== role) return false;
    if (color && color !== "all" && item.colorFamily !== color) return false;
    if (occasion && occasion !== "all" && !item.occasionTags.includes(occasion as never)) return false;
    if (q) {
      const hay = `${item.name} ${item.variantLabel} ${item.meaningShort} ${item.familyId}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return NextResponse.json({ items, total: items.length });
}

