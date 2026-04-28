// Distributor's order list: shows only today's assigned orders — mobile-first
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Package, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function MyOrdersPage() {
  const session = await auth();
  const userId = session!.user.id;

  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      deliveryDate: { gte: start, lte: end },
      status: { in: ["out_for_delivery", "delivered"] },
      assignment: { distributorId: userId },
    },
    include: {
      shop: {
        select: {
          name: true,
          address: true,
          phone: true,
          latitude: true,
          longitude: true,
        },
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const pending = orders.filter((o) => o.status === "out_for_delivery");
  const done = orders.filter((o) => o.status === "delivered");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">طلبات اليوم</h1>
        <p className="text-muted-foreground text-sm">
          {today.toLocaleDateString("ar-SA", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* No orders state */}
      {orders.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-base">لا توجد طلبات معيّنة لك اليوم</p>
          <p className="text-sm mt-1">انتظر حتى يُعيّن لك المدير طلبات</p>
        </div>
      )}

      {/* Pending deliveries */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            في انتظار التسليم ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Completed deliveries */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            ✅ تم التسليم ({done.length})
          </h2>
          <div className="space-y-3 opacity-70">
            {done.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
}: {
  order: {
    id: string;
    status: string;
    shop: {
      name: string;
      address: string;
      phone: string;
      latitude: number | null;
      longitude: number | null;
    };
    _count: { items: number };
  };
}) {
  return (
    <Link href={`/my-orders/${order.id}`}>
      <Card className="active:scale-98 transition-transform cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base">{order.shop.name}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{order.shop.address}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {order._count.items} صنف
              </p>
            </div>
            <div className="flex items-center gap-2">
              {order.status === "delivered" ? (
                <Badge variant="outline" className="text-green-600">
                  مُسلَّم ✓
                </Badge>
              ) : (
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
