"use client";

// Form to assign an order to a distributor and optionally a vehicle
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Truck } from "lucide-react";

interface Distributor {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
}

interface OrderAssignFormProps {
  orderId: string;
  orderStatus: string;
  distributors: Distributor[];
  vehicles: Vehicle[];
  currentAssignment?: {
    distributorId: string;
    vehicleId?: string;
    distributorName: string;
  };
}

const ASSIGNABLE_STATUSES = ["confirmed", "ready_for_distribution", "out_for_delivery"];

export function OrderAssignForm({
  orderId,
  orderStatus,
  distributors,
  vehicles,
  currentAssignment,
}: OrderAssignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [distributorId, setDistributorId] = useState(
    currentAssignment?.distributorId ?? ""
  );
  const [vehicleId, setVehicleId] = useState(
    currentAssignment?.vehicleId ?? ""
  );

  const canAssign = ASSIGNABLE_STATUSES.includes(orderStatus);

  async function handleAssign() {
    if (!distributorId) {
      toast.error("يرجى اختيار موزّع");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distributorId,
          vehicleId: vehicleId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "حدث خطأ");
        return;
      }

      toast.success("تم تعيين الطلب للموزّع");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-4 w-4" />
          التعيين
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentAssignment && (
          <p className="text-sm text-muted-foreground">
            معيّن لـ: <strong>{currentAssignment.distributorName}</strong>
          </p>
        )}

        {canAssign ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">الموزّع</Label>
              <Select value={distributorId} onValueChange={(v) => v && setDistributorId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر موزّعاً..." />
                </SelectTrigger>
                <SelectContent>
                  {distributors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {vehicles.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">المركبة (اختياري)</Label>
                <Select value={vehicleId} onValueChange={(v) => v && setVehicleId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مركبة..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مركبة</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.plateNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleAssign}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              {currentAssignment ? "تحديث التعيين" : "تعيين الموزّع"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {orderStatus === "delivered"
              ? "تم تسليم الطلب"
              : orderStatus === "cancelled"
              ? "الطلب ملغى"
              : "غير متاح في هذه الحالة"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
