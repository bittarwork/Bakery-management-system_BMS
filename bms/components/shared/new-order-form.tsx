"use client";

// New order form: shop selector, delivery date, dynamic line items
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Loader2 } from "lucide-react";

interface Shop {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
}

interface OrderLine {
  productId: string;
  quantity: number;
}

interface NewOrderFormProps {
  shops: Shop[];
  products: Product[];
}

export function NewOrderForm({ shops, products }: NewOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shopId, setShopId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([{ productId: "", quantity: 1 }]);

  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantity: 1 }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof OrderLine, value: string | number) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  }

  // Calculate order total
  const total = lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    return sum + (product?.unitPrice ?? 0) * (line.quantity || 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (!shopId) {
      toast.error("يرجى اختيار المحل");
      return;
    }
    if (validLines.length === 0) {
      toast.error("يرجى إضافة بند واحد على الأقل");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          deliveryDate,
          notes: notes || undefined,
          items: validLines,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "حدث خطأ أثناء إنشاء الطلب");
        return;
      }

      const order = await res.json();
      toast.success("تم إنشاء الطلب بنجاح");
      router.push(`/orders/${order.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Shop and date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>المحل *</Label>
          <Select value={shopId} onValueChange={(v) => v && setShopId(v)} required>
            <SelectTrigger>
              <SelectValue placeholder="اختر المحل..." />
            </SelectTrigger>
            <SelectContent>
              {shops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliveryDate">تاريخ التسليم *</Label>
          <Input
            id="deliveryDate"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
            dir="ltr"
          />
        </div>
      </div>

      {/* Order line items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">بنود الطلب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((line, index) => {
            const selectedProduct = products.find((p) => p.id === line.productId);
            const lineTotal = (selectedProduct?.unitPrice ?? 0) * (line.quantity || 0);

            return (
              <div key={index} className="flex items-center gap-3">
                {/* Product selector */}
                <div className="flex-1">
                  <Select
                    value={line.productId}
                    onValueChange={(v) => v && updateLine(index, "productId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر منتجاً..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {p.unitPrice.toFixed(2)} € / {p.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity input */}
                <Input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, "quantity", parseInt(e.target.value) || 1)}
                  className="w-24"
                  dir="ltr"
                />

                {/* Line subtotal */}
                <span className="text-sm font-mono w-20 text-right" dir="ltr">
                  {lineTotal.toFixed(2)} €
                </span>

                {/* Remove button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4 ml-1" />
            إضافة بند
          </Button>

          <Separator />

          {/* Order total */}
          <div className="flex justify-between font-semibold">
            <span>الإجمالي</span>
            <span dir="ltr">{total.toFixed(2)} €</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات (اختياري)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي تعليمات خاصة..."
          rows={2}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
          إنشاء الطلب
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
