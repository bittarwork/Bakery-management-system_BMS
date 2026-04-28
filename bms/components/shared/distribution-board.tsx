"use client";

// Distribution board: assign distributors to orders with inline dropdowns
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, CalendarDays } from "lucide-react";

interface OrderItem {
  id: string;
  shopName: string;
  shopAddress: string;
  latitude?: number;
  longitude?: number;
  itemCount: number;
  status: string;
  assignment?: {
    distributorId: string;
    distributorName: string;
    vehicleId?: string;
    vehicleName?: string;
  };
}

interface Distributor {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
}

interface DistributionBoardProps {
  orders: OrderItem[];
  distributors: Distributor[];
  vehicles: Vehicle[];
  filterDate: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: "مؤكد", color: "bg-blue-100 text-blue-700" },
  ready_for_distribution: { label: "جاهز", color: "bg-yellow-100 text-yellow-700" },
  out_for_delivery: { label: "في الطريق", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "مُسلَّم", color: "bg-green-100 text-green-700" },
};

export function DistributionBoard({
  orders,
  distributors,
  vehicles,
  filterDate,
}: DistributionBoardProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<
    Record<string, { distributorId: string; vehicleId: string }>
  >(
    Object.fromEntries(
      orders.map((o) => [
        o.id,
        {
          distributorId: o.assignment?.distributorId ?? "",
          vehicleId: o.assignment?.vehicleId ?? "",
        },
      ])
    )
  );
  const [loading, setLoading] = useState<string | null>(null);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/distribution?date=${e.target.value}`);
  }

  async function assignOrder(orderId: string) {
    const { distributorId, vehicleId } = assignments[orderId] ?? {};
    if (!distributorId) {
      toast.error("يرجى اختيار موزّع");
      return;
    }

    setLoading(orderId);
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

      toast.success("تم تعيين الطلب");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const unassigned = orders.filter((o) => !o.assignment);
  const assigned = orders.filter((o) => o.assignment);

  return (
    <div className="space-y-6">
      {/* Date picker */}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={filterDate}
          onChange={handleDateChange}
          className="w-44"
          dir="ltr"
        />
        <span className="text-sm text-muted-foreground">
          {orders.length} طلب إجمالي · {unassigned.length} غير معيّن
        </span>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>لا توجد طلبات جاهزة للتوزيع في هذا اليوم</p>
        </div>
      )}

      {/* Unassigned orders */}
      {unassigned.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 text-amber-700">
            ⏳ طلبات بحاجة إلى تعيين ({unassigned.length})
          </h2>
          <div className="space-y-3">
            {unassigned.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                distributors={distributors}
                vehicles={vehicles}
                value={assignments[order.id]}
                onChange={(field, val) =>
                  setAssignments((p) => ({
                    ...p,
                    [order.id]: { ...p[order.id], [field]: val },
                  }))
                }
                onAssign={() => assignOrder(order.id)}
                loading={loading === order.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Assigned orders */}
      {assigned.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 text-muted-foreground">
            ✅ طلبات معيّنة ({assigned.length})
          </h2>
          <div className="space-y-3">
            {assigned.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                distributors={distributors}
                vehicles={vehicles}
                value={assignments[order.id]}
                onChange={(field, val) =>
                  setAssignments((p) => ({
                    ...p,
                    [order.id]: { ...p[order.id], [field]: val },
                  }))
                }
                onAssign={() => assignOrder(order.id)}
                loading={loading === order.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface OrderRowProps {
  order: OrderItem;
  distributors: Distributor[];
  vehicles: Vehicle[];
  value: { distributorId: string; vehicleId: string };
  onChange: (field: "distributorId" | "vehicleId", value: string) => void;
  onAssign: () => void;
  loading: boolean;
}

function OrderRow({
  order,
  distributors,
  vehicles,
  value,
  onChange,
  onAssign,
  loading,
}: OrderRowProps) {
  const statusInfo = STATUS_LABELS[order.status];
  const isDelivered = order.status === "delivered";

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Shop info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{order.shopName}</p>
              {statusInfo && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{order.shopAddress}</p>
            <p className="text-xs text-muted-foreground">{order.itemCount} صنف</p>
          </div>

          {/* Map link */}
          {order.latitude && order.longitude && (
            <a
              href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary"
            >
              <MapPin className="h-4 w-4" />
            </a>
          )}

          {/* Distributor select */}
          {!isDelivered && (
            <>
              <Select
                value={value?.distributorId ?? ""}
                onValueChange={(v) => v && onChange("distributorId", v)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="الموزّع..." />
                </SelectTrigger>
                <SelectContent>
                  {distributors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {vehicles.length > 0 && (
                <Select
                  value={value?.vehicleId ?? ""}
                  onValueChange={(v) => v && onChange("vehicleId", v)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="المركبة..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مركبة</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button size="sm" onClick={onAssign} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : order.assignment ? (
                  "تحديث"
                ) : (
                  "تعيين"
                )}
              </Button>
            </>
          )}

          {isDelivered && (
            <Badge variant="outline" className="text-green-600">
              ✓ مُسلَّم
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
