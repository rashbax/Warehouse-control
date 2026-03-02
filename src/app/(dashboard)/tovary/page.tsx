import { prisma } from "@/lib/prisma";
import SkuList from "@/components/tovary/SkuList";

export default async function TovaryPage() {
  const skus = await prisma.sKU.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      artikul: true,
      model: true,
      color: true,
      imageUrl: true,
      note: true,
    },
  });

  return <SkuList skus={skus} />;
}
