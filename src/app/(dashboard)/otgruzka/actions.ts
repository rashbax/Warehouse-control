"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ALLOWED_MARKETPLACES = ["Wildberries", "Ozon", "Uzum Market", "Yandex Market", "Другое"];

export async function createOtgruzka(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const skuId = formData.get("skuId") as string;
  const qty = parseInt(formData.get("qty") as string, 10);
  if (!qty || qty < 1) throw new Error("Количество должно быть больше 0.");

  const date = formData.get("date") as string;
  const marketplace = (formData.get("marketplace") as string).trim();
  if (!marketplace) throw new Error("Выберите маркетплейс для отгрузки.");
  if (!ALLOWED_MARKETPLACES.includes(marketplace)) {
    throw new Error("Недопустимый маркетплейс.");
  }
  const chestnyZnak = (formData.get("chestnyZnak") as string | null)?.trim();
  if (!chestnyZnak) throw new Error("Укажите Честный знак.");
  const note = (formData.get("note") as string).trim();

  // Check stock for this specific Честный знак
  const groups = await prisma.operation.groupBy({
    by: ["type"],
    where: { skuId, chestnyZnak },
    _sum: { qty: true },
  });
  let currentStock = 0;
  for (const g of groups) {
    const q = g._sum.qty ?? 0;
    currentStock += g.type === "PRIHOD" ? q : -q;
  }
  if (qty > currentStock) {
    throw new Error(
      `Недостаточно товара на складе. Остаток по коду «${chestnyZnak}»: ${currentStock} шт., запрошено: ${qty} шт.`
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
      chestnyZnak,
      note: note || undefined,
    },
  });

  revalidatePath("/otgruzka");
  revalidatePath("/ostatki");
  revalidatePath("/istoriya");
}
