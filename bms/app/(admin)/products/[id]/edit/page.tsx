// Product edit page: loads product data into the form
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/shared/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تعديل المنتج</h1>
        <p className="text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm
        mode="edit"
        initialData={{
          id: product.id,
          name: product.name,
          sku: product.sku ?? undefined,
          unit: product.unit,
          unitPrice: Number(product.unitPrice),
          isActive: product.isActive,
        }}
      />
    </div>
  );
}
