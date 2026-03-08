"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createServiceClient, STORAGE_BUCKET } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ALLOWED_MARKETPLACES = ["Wildberries", "Ozon", "Uzum Market", "Yandex Market", "Другое"];

export async function createSku(formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const artikul = (formData.get("artikul") as string).trim();
  const model = (formData.get("model") as string).trim();
  const color = (formData.get("color") as string).trim();
  const marketplace = (formData.get("marketplace") as string)?.trim() || "";
  if (!artikul) return { error: "Заполните артикул." };
  if (!model) return { error: "Заполните модель." };
  if (!color) return { error: "Заполните цвет." };
  if (!marketplace || !ALLOWED_MARKETPLACES.includes(marketplace)) {
    return { error: "Выберите маркетплейс." };
  }
  const costPriceRaw = formData.get("costPrice") as string;
  if (!costPriceRaw) return { error: "Заполните себестоимость." };
  const costPrice = parseFloat(costPriceRaw);
  if (isNaN(costPrice) || costPrice < 0) return { error: "Себестоимость должна быть числом >= 0." };
  const imageFile = formData.get("image") as File | null;

  let imageUrl: string | undefined;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImageToStorage(imageFile);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Ошибка загрузки изображения." };
    }
  }

  try {
    await prisma.sKU.create({
      data: { artikul, model, color, marketplace, costPrice, imageUrl },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return { error: `Артикул «${artikul}» уже существует. Выберите другой.` };
    }
    return { error: "Ошибка при создании товара." };
  }

  revalidatePath("/tovary");
  return {};
}

export async function updateSku(id: string, formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const model = (formData.get("model") as string).trim();
  const color = (formData.get("color") as string).trim();
  const marketplace = (formData.get("marketplace") as string)?.trim() || "";
  if (!model) return { error: "Заполните модель." };
  if (!color) return { error: "Заполните цвет." };
  if (!marketplace || !ALLOWED_MARKETPLACES.includes(marketplace)) {
    return { error: "Выберите маркетплейс." };
  }
  const costPriceRaw = formData.get("costPrice") as string;
  if (!costPriceRaw) return { error: "Заполните себестоимость." };
  const costPrice = parseFloat(costPriceRaw);
  if (isNaN(costPrice) || costPrice < 0) return { error: "Себестоимость должна быть числом >= 0." };
  const imageFile = formData.get("image") as File | null;

  let imageUrl: string | undefined;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImageToStorage(imageFile);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Ошибка загрузки изображения." };
    }
  }

  try {
    await prisma.sKU.update({
      where: { id },
      data: { model, color, marketplace, costPrice, ...(imageUrl ? { imageUrl } : {}) },
    });
  } catch {
    return { error: "Ошибка при обновлении товара." };
  }

  revalidatePath("/tovary");
  return {};
}

export async function deleteSku(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    await prisma.$transaction([
      prisma.operation.deleteMany({ where: { skuId: id } }),
      prisma.sKU.delete({ where: { id } }),
    ]);
  } catch {
    return { error: "Ошибка при удалении товара." };
  }

  revalidatePath("/tovary");
  revalidatePath("/ostatki");
  revalidatePath("/istoriya");
  return {};
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

  if (error) throw new Error(`Ошибка загрузки: ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}
