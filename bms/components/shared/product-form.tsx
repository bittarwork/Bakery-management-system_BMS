"use client";

// Reusable product create/edit form
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ProductFormProps {
  initialData?: {
    id?: string;
    name: string;
    sku?: string;
    unit: string;
    unitPrice: number;
    isActive?: boolean;
  };
  mode: "create" | "edit";
}

export function ProductForm({ initialData, mode }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    sku: initialData?.sku ?? "",
    unit: initialData?.unit ?? "قطعة",
    unitPrice: initialData?.unitPrice?.toString() ?? "",
    isActive: initialData?.isActive ?? true,
    priceNote: "",
  });

  function update(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = mode === "create" ? "/api/products" : `/api/products/${initialData?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku || undefined,
          unit: form.unit,
          unitPrice: parseFloat(form.unitPrice),
          isActive: form.isActive,
          priceNote: form.priceNote || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "حدث خطأ");
        return;
      }

      toast.success(mode === "create" ? "تم إضافة المنتج بنجاح" : "تم تحديث المنتج");
      router.push("/products");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="name">اسم المنتج *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
          placeholder="خبز أبيض"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">رمز المنتج (SKU)</Label>
          <Input
            id="sku"
            value={form.sku}
            onChange={(e) => update("sku", e.target.value)}
            dir="ltr"
            placeholder="BREAD-001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">الوحدة *</Label>
          <Input
            id="unit"
            value={form.unit}
            onChange={(e) => update("unit", e.target.value)}
            required
            placeholder="قطعة، رغيف، كغ..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unitPrice">السعر بالوحدة (€) *</Label>
        <Input
          id="unitPrice"
          type="number"
          step="0.01"
          min="0"
          value={form.unitPrice}
          onChange={(e) => update("unitPrice", e.target.value)}
          required
          dir="ltr"
          placeholder="0.50"
        />
      </div>

      {/* Show price change note only in edit mode */}
      {mode === "edit" && (
        <div className="space-y-2">
          <Label htmlFor="priceNote">سبب تغيير السعر (اختياري)</Label>
          <Input
            id="priceNote"
            value={form.priceNote}
            onChange={(e) => update("priceNote", e.target.value)}
            placeholder="زيادة تكاليف المواد الخام..."
          />
        </div>
      )}

      {mode === "edit" && (
        <div className="flex items-center gap-3">
          <input
            id="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="isActive">المنتج نشط</Label>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
          {mode === "create" ? "إضافة المنتج" : "حفظ التعديلات"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
