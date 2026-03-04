"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPrihod(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const skuId = formData.get("skuId") as string;
  if (!skuId) throw new Error("Выберите товар.");

  const qty = parseInt(formData.get("qty") as string, 10);
  if (!qty || qty < 1) throw new Error("Количество должно быть больше 0.");

  const chestnyZnak = (formData.get("chestnyZnak") as string | null)?.trim();
  if (!chestnyZnak) throw new Error("Укажите Честный знак.");

  const date = formData.get("date") as string;
  const note = (formData.get("note") as string).trim();

  const sku = await prisma.sKU.findUnique({ where: { id: skuId }, select: { marketplace: true } });
  if (!sku) throw new Error("Товар не найден.");

  await prisma.operation.create({
    data: {
      type: "PRIHOD",
      skuId,
      qty,
      date: new Date(date),
      userId: session.user.id,
      marketplace: sku.marketplace || undefined,
      chestnyZnak,
      note: note || undefined,
    },
  });

  revalidatePath("/prihod");
  revalidatePath("/ostatki");
  revalidatePath("/istoriya");
}
