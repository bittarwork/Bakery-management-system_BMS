// New product creation page
import { ProductForm } from "@/components/shared/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إضافة منتج جديد</h1>
        <p className="text-muted-foreground">أدخل بيانات المنتج وسعره الابتدائي</p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
