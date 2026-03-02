import { prisma } from "@/lib/prisma";
import OstatkiTable from "@/components/ostatki/OstatkiTable";

export default async function OstatkiPage() {
  // Fetch SKUs and compute stock + last date at the database level
  const [skus, stockAgg, lastDates] = await Promise.all([
    prisma.sKU.findMany({
      orderBy: { artikul: "asc" },
      select: { id: true, artikul: true, model: true, color: true, imageUrl: true },
    }),
    prisma.operation.groupBy({
      by: ["skuId", "type"],
      _sum: { qty: true },
    }),
    prisma.operation.groupBy({
      by: ["skuId"],
      _max: { date: true },
    }),
  ]);

  // Build stock map from aggregation
  const stockMap = new Map<string, number>();
  for (const g of stockAgg) {
    const qty = g._sum.qty ?? 0;
    const prev = stockMap.get(g.skuId) ?? 0;
    stockMap.set(g.skuId, prev + (g.type === "PRIHOD" ? qty : -qty));
  }

  // Build last-date map
  const dateMap = new Map<string, Date>();
  for (const g of lastDates) {
    if (g._max.date) dateMap.set(g.skuId, g._max.date);
  }

  const rows = skus
    .map((sku) => {
      const stock = stockMap.get(sku.id) ?? 0;
      const lastDate = dateMap.get(sku.id) ?? null;
      return {
        id: sku.id,
        artikul: sku.artikul,
        model: sku.model,
        color: sku.color,
        imageUrl: sku.imageUrl,
        stock,
        lastDate: lastDate ? lastDate.toISOString() : null,
      };
    })
    .filter((row) => row.stock > 0);

  return <OstatkiTable rows={rows} />;
}
