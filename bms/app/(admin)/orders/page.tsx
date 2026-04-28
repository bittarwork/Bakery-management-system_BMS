// Orders list page: daily work list with date filter and status filter
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { OrderFilters } from "@/components/shared/order-filters";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "مسودة", variant: "secondary" },
  confirmed: { label: "مؤكد", variant: "outline" },
  ready_for_distribution: { label: "جاهز للتوزيع", variant: "default" },
  out_for_delivery: { label: "في الطريق", variant: "default" },
  delivered: { label: "مُسلَّم", variant: "outline" },
  cancelled: { label: "ملغى", variant: "destructive" },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string }>;
}) {
  const { date, status } = await searchParams;

  // Default to today if no date provided
  const filterDate = date ?? new Date().toISOString().split("T")[0];

  const start = new Date(`${filterDate}T00:00:00`);
  const end = new Date(`${filterDate}T23:59:59`);

  const orders = await prisma.order.findMany({
    where: {
      deliveryDate: { gte: start, lte: end },
      ...(status ? { status: status as never } : {}),
    },
    include: {
      shop: { select: { name: true } },
      assignment: {
        include: { distributor: { select: { name: true } } },
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate total value for delivered orders
  const deliveredOrders = await prisma.orderItem.aggregate({
    where: {
      order: {
        deliveryDate: { gte: start, lte: end },
        status: "delivered",
      },
    },
    _sum: { subtotal: true },
  });

  const dayTotal = deliveredOrders._sum.subtotal?.toNumber() ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الطلبات</h1>
          <p className="text-muted-foreground">
            {orders.length} طلب ·{" "}
            {status
              ? STATUS_LABELS[status]?.label ?? status
              : "جميع الحالات"}
            {dayTotal > 0 && (
              <span dir="ltr"> · {dayTotal.toFixed(2)} € مُسلَّم</span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="h-4 w-4 ml-2" />
            طلب جديد
          </Link>
        </Button>
      </div>

      {/* Date & status filters */}
      <OrderFilters currentDate={filterDate} currentStatus={status} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المحل</TableHead>
                <TableHead>الأصناف</TableHead>
                <TableHead>الموزّع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-24">تفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const statusInfo = STATUS_LABELS[order.status];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.shop.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order._count.items} صنف
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.assignment?.distributor.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo?.variant ?? "secondary"}>
                        {statusInfo?.label ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/orders/${order.id}`}>عرض</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {orders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>لا توجد طلبات لهذا اليوم</p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/orders/new">إنشاء طلب جديد</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
