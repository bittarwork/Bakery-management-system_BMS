// Shop edit page: loads existing shop data into the form
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ShopForm } from "@/components/shared/shop-form";

export default async function EditShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { id } });

  if (!shop) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تعديل المحل</h1>
        <p className="text-muted-foreground">{shop.name}</p>
      </div>
      <ShopForm
        mode="edit"
        initialData={{
          id: shop.id,
          name: shop.name,
          phone: shop.phone,
          email: shop.email ?? undefined,
          shopType: shop.shopType as "RETAIL" | "WHOLESALE" | "CAFE" | "RESTAURANT" | "OTHER",
          address: shop.address,
          latitude: shop.latitude ?? undefined,
          longitude: shop.longitude ?? undefined,
          isActive: shop.isActive,
        }}
      />
    </div>
  );
}
