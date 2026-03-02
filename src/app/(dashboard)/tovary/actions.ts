"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createServiceClient, STORAGE_BUCKET } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ALLOWED_MARKETPLACES = ["Wildberries", "Ozon", "Uzum Market", "Yandex Market", "Другое"];

export async function createSku(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const artikul = (formData.get("artikul") as string).trim();
  const model = (formData.get("model") as string).trim();
  const color = (formData.get("color") as string).trim();
  const honestSign = (formData.get("honestSign") as string)?.trim() || "";
  const note = (formData.get("note") as string).trim();
  const imageFile = formData.get("image") as File | null;

  let imageUrl: string | undefined;
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadImageToStorage(imageFile);
  }

  try {
    await prisma.sKU.create({
      data: {
        artikul,
        model,
        color,
        honestSign: honestSign || undefined,
        note: note || undefined,
        imageUrl,
      },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      throw new Error(`Артикул «${artikul}» уже существует. Выберите другой.`);
    }
    throw err;
  }

  revalidatePath("/tovary");
}

export async function updateSku(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const model = (formData.get("model") as string).trim();
  const color = (formData.get("color") as string).trim();
  const honestSign = (formData.get("honestSign") as string)?.trim() || "";
  const note = (formData.get("note") as string).trim();
  const imageFile = formData.get("image") as File | null;

  let imageUrl: string | undefined;
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadImageToStorage(imageFile);
  }

  await prisma.sKU.update({
    where: { id },
    data: {
      model,
      color,
      honestSign: honestSign || null,
      note: note || undefined,
      ...(imageUrl ? { imageUrl } : {}),
    },
  });

  revalidatePath("/tovary");
}

export async function deleteSku(id: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.$transaction([
    prisma.operation.deleteMany({ where: { skuId: id } }),
    prisma.sKU.delete({ where: { id } }),
  ]);

  revalidatePath("/tovary");
  revalidatePath("/ostatki");
  revalidatePath("/istoriya");
}

export async function getSkuDetails(id: string) {
  const sku = await prisma.sKU.findUnique({
    where: { id },
    select: {
      id: true,
      artikul: true,
      model: true,
      color: true,
      honestSign: true,
      imageUrl: true,
      note: true,
      operations: {
        orderBy: { date: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          qty: true,
          marketplace: true,
          note: true,
          date: true,
          user: { select: { name: true } },
        },
      },
    },
  });
  if (!sku) throw new Error("SKU не найден");

  const stock = await getStockBalance(id);

  return {
    ...sku,
    stock,
    operations: sku.operations.map((op) => ({
      ...op,
      date: op.date.toISOString(),
      userName: op.user.name,
    })),
  };
}

export async function quickPrihod(skuId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const qty = parseInt(formData.get("qty") as string, 10);
  if (!qty || qty < 1) throw new Error("Количество должно быть больше 0.");

  const date = formData.get("date") as string;
  const note = (formData.get("note") as string).trim();

  await prisma.operation.create({
    data: {
      type: "PRIHOD",
      skuId,
      qty,
      date: new Date(date),
      userId,
      note: note || undefined,
    },
  });

  revalidatePath("/tovary");
  revalidatePath("/ostatki");
  revalidatePath("/istoriya");
}

export async function quickOtgruzka(skuId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const qty = parseInt(formData.get("qty") as string, 10);
  if (!qty || qty < 1) throw new Error("Количество должно быть больше 0.");

  const date = formData.get("date") as string;
  const marketplace = (formData.get("marketplace") as string).trim();
  if (!marketplace) throw new Error("Выберите маркетплейс для отгрузки.");
  if (!ALLOWED_MARKETPLACES.includes(marketplace)) {
    throw new Error("Недопустимый маркетплейс.");
  }
  const note = (formData.get("note") as string).trim();

  const currentStock = await getStockBalance(skuId);
  if (qty > currentStock) {
    throw new Error(`Недостаточно товара. Остаток: ${currentStock} шт.`);
  }

  await prisma.operation.create({
    data: {
      type: "OTGRUZKA",
      skuId,
      qty,
      date: new Date(date),
      userId,
      marketplace: marketplace || undefined,
      note: note || undefined,
    },
  });

  revalidatePath("/tovary");
  revalidatePath("/ostatki");
  revalidatePath("/istoriya");
}

async function getStockBalance(skuId: string): Promise<number> {
  const groups = await prisma.operation.groupBy({
    by: ["type"],
    where: { skuId },
    _sum: { qty: true },
  });
  let stock = 0;
  for (const g of groups) {
    const qty = g._sum.qty ?? 0;
    stock += g.type === "PRIHOD" ? qty : -qty;
  }
  return stock;
}

async function uploadImageToStorage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Допустимы только форматы JPG и PNG.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Размер изображения не должен превышать 5 МБ.");
  }

  const supabase = createServiceClient();
  const ext = file.type === "image/png" ? "png" : "jpg";
  const fileName = `${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, buffer, { contentType: file.type });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}
