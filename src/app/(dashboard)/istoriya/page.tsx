import { prisma } from "@/lib/prisma";
import IstoriyaTable from "@/components/istoriya/IstoriyaTable";

export default async function IstoriyaPage() {
  const operations = await prisma.operation.findMany({
    orderBy: { date: "desc" },
    take: 200,
    select: {
      id: true,
      type: true,
      qty: true,
      marketplace: true,
      chestnyZnak: true,
      note: true,
      date: true,
      sku: { select: { artikul: true, model: true, color: true } },
      user: { select: { name: true, role: true } },
    },
  });

  const rows = operations.map((op) => ({
    id: op.id,
    type: op.type,
    qty: op.qty,
    marketplace: op.marketplace,
    chestnyZnak: op.chestnyZnak,
    note: op.note,
    date: op.date.toISOString(),
    artikul: op.sku.artikul,
    model: op.sku.model,
    color: op.sku.color,
    userName: op.user.name,
    userRole: op.user.role,
  }));

  return <IstoriyaTable rows={rows} />;
}
