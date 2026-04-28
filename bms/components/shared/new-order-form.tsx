"use client";

// New order form: shop (with city), delivery date, distributor (required), dynamic line items with isGift toggle
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Loader2, Gift, PackageCheck, User2 } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  city: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
}

interface Distributor {
  id: string;
  name: string;
}

interface OrderLine {
  productId: string;
  quantity: number;
  isGift: boolean;
}

interface NewOrderFormProps {
  shops: Shop[];
  products: Product[];
  distributors: Distributor[];
}

export function NewOrderForm({ shops, products, distributors }: NewOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shopId, setShopId] = useState("");
  const [distributorId, setDistributorId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([
    { productId: "", quantity: 1, isGift: false },
  ]);

  // Group shops by city for the dropdown
  const shopsByCity = shops.reduce<Record<string, Shop[]>>((acc, shop) => {
    const city = shop.city || "أخرى";
    if (!acc[city]) acc[city] = [];
    acc[city].push(shop);
    return acc;
  }, {});

  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantity: 1, isGift: false }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof OrderLine, value: string | number | boolean) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  }

  function toggleGift(index: number) {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, isGift: !line.isGift } : line
      )
    );
  }

  // Invoice total: only non-gift items
  const invoiceTotal = lines.reduce((sum, line) => {
    if (line.isGift) return sum;
    const product = products.find((p) => p.id === line.productId);
    return sum + (product?.unitPrice ?? 0) * (line.quantity || 0);
  }, 0);

  const giftItemsCount = lines.filter((l) => l.isGift && l.productId && l.quantity > 0).length;
  const totalBagsInVehicle = lines
    .filter((l) => l.productId && l.quantity > 0)
    .reduce((sum, l) => sum + l.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validLines = lines.filter((l) => l.productId && l.quantity > 0);

    if (!shopId) { toast.error("يرجى اختيار المحل"); return; }
    if (!distributorId) { toast.error("يرجى اختيار الموزع / السائق"); return; }
    if (validLines.length === 0) { toast.error("يرجى إضافة بند واحد على الأقل"); return; }
    if (!validLines.some((l) => !l.isGift)) {
      toast.error("يجب أن يحتوي الطلب على بند واحد على الأقل غير هدية");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          distributorId,
          deliveryDate,
          notes: notes || undefined,
          items: validLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            isGift: l.isGift,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "حدث خطأ أثناء إنشاء الطلب");
        return;
      }

      const order = await res.json();
      toast.success("تم إنشاء الطلب بنجاح — جاهز للتوزيع");
      router.push(`/orders/${order.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    // No max-w constraint — takes full available width
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ─── Shop + Date ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>المحل *</Label>
          <Select
            value={shopId}
            onValueChange={(v) => v && setShopId(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المحل..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(shopsByCity)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([city, cityShops]) => (
                  <SelectGroup key={city}>
                    <SelectLabel>📍 {city}</SelectLabel>
                    {cityShops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id} label={shop.name}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
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
            className="h-9"
          />
        </div>
      </div>

      {/* ─── Distributor ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User2 className="h-4 w-4 text-muted-foreground" />
          الموزع / السائق *
        </Label>
        <Select
          value={distributorId}
          onValueChange={(v) => v && setDistributorId(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر الموزع المسؤول عن هذا الطلب..." />
          </SelectTrigger>
          <SelectContent>
            {distributors.map((d) => (
              <SelectItem key={d.id} value={d.id} label={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {distributorId && (
          <p className="text-xs text-muted-foreground">
            سيُعيَّن هذا الطلب للموزع فور الإنشاء ويظهر في قائمة طلباته
          </p>
        )}
      </div>

      {/* ─── Order Line Items ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PackageCheck className="h-4 w-4" />
            بنود الطلب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">

          {/* Desktop column headers */}
          <div className="hidden md:grid grid-cols-[1fr_90px_90px_90px_36px] gap-2 text-xs text-muted-foreground px-1 pb-1 border-b">
            <span>المنتج</span>
            <span className="text-center">الكمية</span>
            <span className="text-center">نوع البند</span>
            <span className="text-left">الإجمالي</span>
            <span />
          </div>

          {lines.map((line, index) => {
            const selectedProduct = products.find((p) => p.id === line.productId);
            const lineTotal = line.isGift
              ? null
              : (selectedProduct?.unitPrice ?? 0) * (line.quantity || 0);

            return (
              <div
                key={index}
                className={`rounded-lg border p-2 transition-colors ${
                  line.isGift
                    ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                    : "bg-card border-border"
                }`}
              >
                {/* Desktop layout */}
                <div className="hidden md:grid grid-cols-[1fr_90px_90px_90px_36px] gap-2 items-center">
                  {/* Product selector — label prop ensures trigger shows name not ID */}
                  <Select
                    value={line.productId}
                    onValueChange={(v) => v && updateLine(index, "productId", v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="اختر منتجاً..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          label={p.name}
                        >
                          {p.name}
                          <span className="text-muted-foreground text-xs">
                            {p.unitPrice.toFixed(2)} €/{p.unit}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Quantity */}
                  <Input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, "quantity", parseInt(e.target.value) || 1)}
                    className="h-9 text-center"
                    dir="ltr"
                  />

                  {/* Gift toggle */}
                  <Button
                    type="button"
                    variant={line.isGift ? "default" : "outline"}
                    size="sm"
                    className={`h-9 w-full gap-1.5 transition-all ${
                      line.isGift
                        ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => toggleGift(index)}
                    title="تحديد كهدية — لن تُضاف لفاتورة المحل"
                  >
                    <Gift className="h-3.5 w-3.5" />
                    <span className="text-xs">{line.isGift ? "هدية" : "عادي"}</span>
                  </Button>

                  {/* Line subtotal */}
                  <span
                    className={`text-sm font-mono text-left tabular-nums ${
                      line.isGift ? "text-amber-600 dark:text-amber-400 text-xs" : "font-semibold"
                    }`}
                    dir="ltr"
                  >
                    {line.isGift ? "هدية" : lineTotal !== null ? `${lineTotal.toFixed(2)} €` : "—"}
                  </span>

                  {/* Remove */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => removeLine(index)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Mobile layout — stacked */}
                <div className="flex flex-col gap-2 md:hidden">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Select
                        value={line.productId}
                        onValueChange={(v) => v && updateLine(index, "productId", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="اختر منتجاً..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id} label={p.name}>
                              {p.name}
                              <span className="text-muted-foreground text-xs">
                                {p.unitPrice.toFixed(2)} €/{p.unit}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive flex-shrink-0"
                      onClick={() => removeLine(index)}
                      disabled={lines.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, "quantity", parseInt(e.target.value) || 1)}
                      className="h-9 w-24 text-center"
                      dir="ltr"
                    />
                    <Button
                      type="button"
                      variant={line.isGift ? "default" : "outline"}
                      size="sm"
                      className={`h-9 gap-1.5 ${
                        line.isGift
                          ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => toggleGift(index)}
                    >
                      <Gift className="h-3.5 w-3.5" />
                      <span className="text-xs">{line.isGift ? "هدية" : "عادي"}</span>
                    </Button>
                    <span className="text-sm font-mono mr-auto" dir="ltr">
                      {line.isGift ? (
                        <span className="text-amber-600 text-xs">هدية</span>
                      ) : lineTotal !== null ? (
                        `${lineTotal.toFixed(2)} €`
                      ) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4 ml-1" />
            إضافة بند
          </Button>

          <Separator />

          {/* Summary */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center font-bold text-base">
              <span>إجمالي الفاتورة</span>
              <span dir="ltr">{invoiceTotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>إجمالي الأكياس المحمَّلة</span>
              <span dir="ltr">{totalBagsInVehicle} كيس</span>
            </div>
            {giftItemsCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-md px-3 py-2 mt-2">
                <Gift className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {giftItemsCount} بند{giftItemsCount > 1 ? " هدايا" : " هدية"} — في الحمولة، غير مُفوترة
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Notes ────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات (اختياري)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي تعليمات خاصة للموزع..."
          rows={2}
        />
      </div>

      {/* ─── Submit ───────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="min-w-36">
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
