import { prisma } from "@/lib/prisma";
import OtgruzkaForm from "@/components/otgruzka/OtgruzkaForm";

export default async function OtgruzkaPage() {
  const skus = await prisma.sKU.findMany({
    orderBy: { artikul: "asc" },
    select: { id: true, artikul: true, model: true, color: true },
  });

  return <OtgruzkaForm skus={skus} />;
}
