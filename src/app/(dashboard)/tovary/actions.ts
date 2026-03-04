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
  const marketplace = (formData.get("marketplace") as string)?.trim() || "";
  if (!artikul) throw new Error("Заполните артикул.");
  if (!model) throw new Error("Заполните модель.");
  if (!color) throw new Error("Заполните цвет.");
  if (!marketplace || !ALLOWED_MARKETPLACES.includes(marketplace)) {
    throw new Error("Выберите маркетплейс.");
  }
  const costPriceRaw = formData.get("costPrice") as string;
  if (!costPriceRaw) throw new Error("Заполните себестоимость.");
  const costPrice = parseFloat(costPriceRaw);
  if (isNaN(costPrice) || costPrice < 0) throw new Error("Себестоимость должна быть числом >= 0.");
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
        marketplace,
        costPrice,
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
  const marketplace = (formData.get("marketplace") as string)?.trim() || "";
  if (!model) throw new Error("Заполните модель.");
  if (!color) throw new Error("Заполните цвет.");
  if (!marketplace || !ALLOWED_MARKETPLACES.includes(marketplace)) {
    throw new Error("Выберите маркетплейс.");
  }
  const costPriceRaw = formData.get("costPrice") as string;
  if (!costPriceRaw) throw new Error("Заполните себестоимость.");
  const costPrice = parseFloat(costPriceRaw);
  if (isNaN(costPrice) || costPrice < 0) throw new Error("Себестоимость должна быть числом >= 0.");
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
      marketplace,
      costPrice,
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
