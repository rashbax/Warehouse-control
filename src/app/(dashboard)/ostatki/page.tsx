import { prisma } from "@/lib/prisma";
import OstatkiTable from "@/components/ostatki/OstatkiTable";

export default async function OstatkiPage() {
  const [skus, allOps] = await Promise.all([
    prisma.sKU.findMany({
      orderBy: { artikul: "asc" },
      select: { id: true, artikul: true, model: true, color: true, imageUrl: true, marketplace: true, costPrice: true },
    }),
    prisma.operation.findMany({
      select: {
        skuId: true,
        type: true,
        qty: true,
        chestnyZnak: true,
        date: true,
      },
    }),
  ]);

  const skuMap = new Map(skus.map((s) => [s.id, s]));

  // Regular stock (operations without Честный знак)
  const regularStock = new Map<string, { qty: number; lastDate: Date | null }>();

  // Честный знак items: each unique (skuId, chestnyZnak) pair tracks real qty
  const znakStock = new Map<
    string,
    { skuId: string; chestnyZnak: string; qty: number; lastDate: Date | null }
  >();

  for (const op of allOps) {
    const d = op.date;

    if (!op.chestnyZnak) {
      const prev = regularStock.get(op.skuId) ?? { qty: 0, lastDate: null };
      const delta = op.type === "PRIHOD" ? op.qty : -op.qty;
      const newLastDate = !prev.lastDate || d > prev.lastDate ? d : prev.lastDate;
      regularStock.set(op.skuId, { qty: prev.qty + delta, lastDate: newLastDate });
    } else {
      const key = `${op.skuId}::${op.chestnyZnak}`;
      const prev = znakStock.get(key) ?? {
        skuId: op.skuId,
        chestnyZnak: op.chestnyZnak,
        qty: 0,
        lastDate: null,
      };
      const delta = op.type === "PRIHOD" ? op.qty : -op.qty;
      const newLastDate = !prev.lastDate || d > prev.lastDate ? d : prev.lastDate;
      znakStock.set(key, { ...prev, qty: prev.qty + delta, lastDate: newLastDate });
    }
  }

  type Row = {
    key: string;
    id: string;
    artikul: string;
    model: string;
    color: string;
    marketplace: string;
    costPrice: number;
    imageUrl: string | null;
    stock: number;
    lastDate: string | null;
    chestnyZnak: string | null;
  };

  const rows: Row[] = [];

  // Regular rows
  for (const [skuId, agg] of regularStock) {
    if (agg.qty <= 0) continue;
    const sku = skuMap.get(skuId);
    if (!sku) continue;
    rows.push({
      key: skuId,
      id: skuId,
      artikul: sku.artikul,
      model: sku.model,
      color: sku.color,
      marketplace: sku.marketplace,
      costPrice: sku.costPrice,
      imageUrl: sku.imageUrl,
      stock: agg.qty,
      lastDate: agg.lastDate ? agg.lastDate.toISOString() : null,
      chestnyZnak: null,
    });
  }

  // Честный знак rows — one row per unique code, show actual qty
  for (const [, zn] of znakStock) {
    if (zn.qty <= 0) continue;
    const sku = skuMap.get(zn.skuId);
    if (!sku) continue;
    rows.push({
      key: `${zn.skuId}::${zn.chestnyZnak}`,
      id: zn.skuId,
      artikul: sku.artikul,
      model: sku.model,
      color: sku.color,
      marketplace: sku.marketplace,
      costPrice: sku.costPrice,
      imageUrl: sku.imageUrl,
      stock: zn.qty,
      lastDate: zn.lastDate ? zn.lastDate.toISOString() : null,
      chestnyZnak: zn.chestnyZnak,
    });
  }

  // Sort: artikul first, then честный знак items after aggregate
  rows.sort((a, b) => {
    const c = a.artikul.localeCompare(b.artikul);
    if (c !== 0) return c;
    if (a.chestnyZnak && b.chestnyZnak) return a.chestnyZnak.localeCompare(b.chestnyZnak);
    if (a.chestnyZnak) return 1;
    return -1;
  });

  return <OstatkiTable rows={rows} />;
}
