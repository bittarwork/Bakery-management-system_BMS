// New order creation page: select shop, set date, add product items
import { prisma } from "@/lib/prisma";
import { NewOrderForm } from "@/components/shared/new-order-form";

export default async function NewOrderPage() {
  const [shops, products] = await Promise.all([
    prisma.shop.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, unitPrice: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">طلب جديد</h1>
        <p className="text-muted-foreground">اختر المحل وأضف المنتجات والكميات</p>
      </div>
      <NewOrderForm
        shops={shops}
        products={products.map((p) => ({
          ...p,
          unitPrice: Number(p.unitPrice),
        }))}
      />
    </div>
  );
}
