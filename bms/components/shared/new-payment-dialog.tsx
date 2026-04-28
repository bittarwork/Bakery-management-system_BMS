"use client";

// Dialog for recording a new payment
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";

interface Shop {
  id: string;
  name: string;
}

interface NewPaymentDialogProps {
  shops: Shop[];
}

export function NewPaymentDialog({ shops }: NewPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shopId: "",
    amount: "",
    method: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    reference: "",
    notes: "",
  });

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: form.shopId,
          amount: parseFloat(form.amount),
          method: form.method,
          paymentDate: form.paymentDate,
          reference: form.reference || undefined,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "حدث خطأ");
        return;
      }

      toast.success("تم تسجيل الدفعة بنجاح");
      setOpen(false);
      setForm({
        shopId: "",
        amount: "",
        method: "CASH",
        paymentDate: new Date().toISOString().split("T")[0],
        reference: "",
        notes: "",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            تسجيل دفعة
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>المحل *</Label>
            <Select value={form.shopId} onValueChange={(v) => v && update("shopId", v)} required>
              <SelectTrigger>
                <SelectValue placeholder="اختر المحل..." />
              </SelectTrigger>
              <SelectContent>
                {shops.map((s) => (
                  <SelectItem key={s.id} value={s.id} label={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                required
                dir="ltr"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={form.method} onValueChange={(v) => v && update("method", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">نقداً</SelectItem>
                  <SelectItem value="BANK_TRANSFER">تحويل بنكي</SelectItem>
                  <SelectItem value="CHECK">شيك</SelectItem>
                  <SelectItem value="OTHER">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">التاريخ *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={form.paymentDate}
              onChange={(e) => update("paymentDate", e.target.value)}
              required
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">المرجع (شيك / تحويل)</Label>
            <Input
              id="reference"
              value={form.reference}
              onChange={(e) => update("reference", e.target.value)}
              dir="ltr"
              placeholder="رقم الشيك أو المرجع البنكي"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              تسجيل الدفعة
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
