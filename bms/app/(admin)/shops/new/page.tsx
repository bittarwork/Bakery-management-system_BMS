// New shop creation page
import { ShopForm } from "@/components/shared/shop-form";

export default function NewShopPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إضافة محل جديد</h1>
        <p className="text-muted-foreground">أدخل بيانات المحل وحدد موقعه على الخريطة</p>
      </div>
      <ShopForm mode="create" />
    </div>
  );
}
