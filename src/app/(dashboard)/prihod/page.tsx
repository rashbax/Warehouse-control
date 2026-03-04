import { prisma } from "@/lib/prisma";
import PrihodForm from "@/components/prihod/PrihodForm";

export default async function PrihodPage() {
  const skus = await prisma.sKU.findMany({
    orderBy: { artikul: "asc" },
    select: { id: true, artikul: true, model: true, color: true, marketplace: true },
  });

  return <PrihodForm skus={skus} />;
}
