// New order creation page: fetches shops (with city), products, and distributors
import { prisma } from "@/lib/prisma";
import { NewOrderForm } from "@/components/shared/new-order-form";

export default async function NewOrderPage() {
  const [shops, products, distributors] = await Promise.all([
    prisma.shop.findMany({
      where: { isActive: true },
      orderBy: [{ city: "asc" }, { name: "asc" }],
      select: { id: true, name: true, city: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, unitPrice: true },
    }),
    prisma.user.findMany({
      where: { role: "DISTRIBUTOR", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">طلب جديد</h1>
        <p className="text-muted-foreground">
          اختر المحل والسائق وأضف المنتجات — الطلب يُحفظ مباشرةً بحالة &quot;جاهز للتوزيع&quot;
        </p>
      </div>
      <NewOrderForm
        shops={shops}
        products={products.map((p) => ({
          ...p,
          unitPrice: Number(p.unitPrice),
        }))}
        distributors={distributors}
      />
    </div>
  );
}
