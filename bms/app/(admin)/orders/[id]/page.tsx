// Order detail page: items, status controls, assignment, and event log
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusControls } from "@/components/shared/order-status-controls";
import { OrderAssignForm } from "@/components/shared/order-assign-form";
import { ArrowRight, MapPin, Phone, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "مسودة", variant: "secondary" },
  confirmed: { label: "مؤكد", variant: "outline" },
  ready_for_distribution: { label: "جاهز للتوزيع", variant: "default" },
  out_for_delivery: { label: "في الطريق", variant: "default" },
  delivered: { label: "مُسلَّم", variant: "outline" },
  cancelled: { label: "ملغى", variant: "destructive" },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      shop: true,
      items: {
        include: { product: { select: { name: true, unit: true } } },
      },
      events: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      assignment: {
        include: {
          distributor: { select: { id: true, name: true } },
          vehicle: true,
          assignedBy: { select: { name: true } },
        },
      },
      createdBy: { select: { name: true } },
    },
  });

  if (!order) notFound();

  const distributors = await prisma.user.findMany({
    where: { role: "DISTRIBUTOR", isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const vehicles = await prisma.vehicle.findMany({
    where: { isActive: true },
    select: { id: true, name: true, plateNumber: true },
    orderBy: { name: "asc" },
  });

  const orderTotal = order.items.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0
  );

  const statusInfo = STATUS_LABELS[order.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/orders">
              <ArrowRight className="h-4 w-4 ml-1" />
              الطلبات
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{order.shop.name}</h1>
            <p className="text-muted-foreground" dir="ltr">
              {new Date(order.deliveryDate).toLocaleDateString("ar-SA")}
            </p>
          </div>
        </div>
        <Badge variant={statusInfo?.variant ?? "secondary"} className="text-sm px-3 py-1">
          {statusInfo?.label ?? order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content: items + events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shop info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">معلومات المحل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span dir="ltr">{order.shop.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5" />
                <span>{order.shop.address}</span>
              </div>
              {order.shop.latitude && order.shop.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${order.shop.latitude},${order.shop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline"
                >
                  فتح في خرائط جوجل ↗
                </a>
              )}
            </CardContent>
          </Card>

          {/* Order items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">بنود الطلب</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الوحدة</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>سعر الوحدة</TableHead>
                    <TableHead>الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.product.unit}
                      </TableCell>
                      <TableCell dir="ltr">{item.quantity}</TableCell>
                      <TableCell dir="ltr" className="font-mono">
                        {Number(item.unitPriceSnapshot).toFixed(2)} €
                      </TableCell>
                      <TableCell dir="ltr" className="font-mono font-semibold">
                        {Number(item.subtotal).toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center p-4 font-bold text-base border-t">
                <span>الإجمالي</span>
                <span dir="ltr">{orderTotal.toFixed(2)} €</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Event log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                سجل الأحداث
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.events.map((event, idx) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                      {idx < order.events.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.actor.name} ·{" "}
                        {new Date(event.createdAt).toLocaleString("ar-SA")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: controls */}
        <div className="space-y-4">
          {/* Status update */}
          <OrderStatusControls orderId={order.id} currentStatus={order.status} />

          {/* Assignment */}
          <OrderAssignForm
            orderId={order.id}
            currentAssignment={
              order.assignment
                ? {
                    distributorId: order.assignment.distributorId,
                    vehicleId: order.assignment.vehicleId ?? undefined,
                    distributorName: order.assignment.distributor.name,
                  }
                : undefined
            }
            distributors={distributors}
            vehicles={vehicles}
            orderStatus={order.status}
          />

          {/* Meta info */}
          <Card>
            <CardContent className="py-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">أُنشئ بواسطة</span>
                <span>{order.createdBy.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ الإنشاء</span>
                <span dir="ltr">{new Date(order.createdAt).toLocaleDateString("ar-SA")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
