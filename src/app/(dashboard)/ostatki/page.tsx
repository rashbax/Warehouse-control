import { prisma } from "@/lib/prisma";
import OstatkiTable from "@/components/ostatki/OstatkiTable";

export default async function OstatkiPage() {
  const skus = await prisma.sKU.findMany({
    orderBy: { artikul: "asc" },
    select: {
      id: true,
      artikul: true,
      model: true,
      color: true,
      imageUrl: true,
      operations: {
        select: { type: true, qty: true, date: true },
      },
    },
  });

  const rows = skus
    .map((sku) => {
      const stock = sku.operations.reduce((acc, op) => {
        return op.type === "PRIHOD" ? acc + op.qty : acc - op.qty;
      }, 0);
      const lastDate =
        sku.operations.length > 0
          ? new Date(Math.max(...sku.operations.map((op) => new Date(op.date).getTime())))
          : null;
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
