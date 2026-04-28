"use client";

// Admin controls to change order status with one click
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// v2: simplified lifecycle — no draft/confirmed
type OrderStatus = "ready_for_distribution" | "out_for_delivery" | "delivered" | "cancelled";

interface StatusAction {
  status: OrderStatus;
  label: string;
  variant: "default" | "outline" | "destructive";
}

const TRANSITIONS: Record<OrderStatus, StatusAction[]> = {
  ready_for_distribution: [
    { status: "out_for_delivery", label: "خرج للتسليم", variant: "default" },
    { status: "cancelled", label: "إلغاء الطلب", variant: "destructive" },
  ],
  out_for_delivery: [
    { status: "delivered", label: "تم التسليم ✓", variant: "default" },
  ],
  delivered: [],
  cancelled: [],
};

interface OrderStatusControlsProps {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusControls({ orderId, currentStatus }: OrderStatusControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = TRANSITIONS[currentStatus as OrderStatus] ?? [];

  async function changeStatus(status: OrderStatus) {
    setLoading(status);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "حدث خطأ");
        return;
      }

      toast.success("تم تحديث حالة الطلب");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">تغيير الحالة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.status}
            variant={action.variant}
            className="w-full"
            onClick={() => changeStatus(action.status)}
            disabled={loading !== null}
          >
            {loading === action.status ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : null}
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
