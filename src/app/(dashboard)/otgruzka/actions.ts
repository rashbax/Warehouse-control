"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOtgruzka(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const skuId = formData.get("skuId") as string;
  const qty = parseInt(formData.get("qty") as string, 10);
  if (!qty || qty < 1) throw new Error("Количество должно быть больше 0.");

  const date = formData.get("date") as string;
  const marketplace = (formData.get("marketplace") as string).trim();
  if (!marketplace) throw new Error("Выберите маркетплейс для отгрузки.");
  const note = (formData.get("note") as string).trim();

  // Check current stock balance
  const ops = await prisma.operation.findMany({
    where: { skuId },
    select: { type: true, qty: true },
  });
  const currentStock = ops.reduce((acc, op) => {
    return op.type === "PRIHOD" ? acc + op.qty : acc - op.qty;
  }, 0);

  if (qty > currentStock) {
    throw new Error(
      `Недостаточно товара на складе. Остаток: ${currentStock} шт., запрошено: ${qty} шт.`
    );
  }

  await prisma.operation.create({
    data: {
      type: "OTGRUZKA",
      skuId,
      qty,
      date: new Date(date),
      userId: session.user.id,
      marketplace: marketplace || undefined,
      note: note || undefined,
    },
  });

  revalidatePath("/otgruzka");
  revalidatePath("/ostatki");
  revalidatePath("/istoriya");
}
