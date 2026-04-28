// Order detail page: items (with isGift badge), distributor, status controls, assignment, and event log
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
import { ArrowRight, MapPin, Phone, Clock, Gift, User2, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// v2 status labels — draft/confirmed removed
const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
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
      // Direct distributor relation (v2)
      distributor: { select: { id: true, name: true } },
      items: {
        include: { product: { select: { name: true, unit: true } } },
        orderBy: { isGift: "asc" }, // non-gift items first
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

  const [distributors, vehicles] = await Promise.all([
    prisma.user.findMany({
      where: { role: "DISTRIBUTOR", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.vehicle.findMany({
      where: { isActive: true },
      select: { id: true, name: true, plateNumber: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Invoice total: sum of non-gift items subtotals only
  const invoiceTotal = order.items
    .filter((item) => !item.isGift)
    .reduce((sum, item) => sum + Number(item.subtotal), 0);

  const giftItems = order.items.filter((item) => item.isGift);
  const statusInfo = STATUS_LABELS[order.status];

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/orders">
              <ArrowRight className="h-4 w-4 ml-1" />
              الطلبات
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{order.shop.name}</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {order.shop.city}
              <span className="text-border">·</span>
              <span dir="ltr">
                {new Date(order.deliveryDate).toLocaleDateString("ar-SA")}
              </span>
            </p>
          </div>
        </div>
        <Badge
          variant={statusInfo?.variant ?? "secondary"}
          className="text-sm px-3 py-1"
        >
          {statusInfo?.label ?? order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Main content ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Shop + Distributor info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">معلومات التسليم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Shop */}
              <div className="flex items-start gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-foreground">{order.shop.name}</span>
                  <span className="mx-1.5">·</span>
                  <span>{order.shop.city}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span dir="ltr">{order.shop.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{order.shop.address}</span>
              </div>
              {order.shop.latitude && order.shop.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${order.shop.latitude},${order.shop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline inline-flex items-center gap-1"
                >
                  فتح في خرائط جوجل ↗
                </a>
              )}

              <Separator />

              {/* Assigned distributor */}
              <div className="flex items-center gap-2">
                <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">الموزع المعيَّن:</span>
                <span className="font-medium">
                  {order.distributor?.name ?? order.assignment?.distributor.name ?? "—"}
                </span>
                {order.assignment?.vehicle && (
                  <span className="text-xs text-muted-foreground">
                    · {order.assignment.vehicle.name} ({order.assignment.vehicle.plateNumber})
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                بنود الطلب
                {giftItems.length > 0 && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs gap-1">
                    <Gift className="h-3 w-3" />
                    {giftItems.length} هدية
                  </Badge>
                )}
              </CardTitle>
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
                    <TableRow
                      key={item.id}
                      className={
                        item.isGift
                          ? "bg-amber-50 dark:bg-amber-950/20"
                          : undefined
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.product.name}
                          {item.isGift && (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-300 text-xs gap-1 py-0"
                            >
                              <Gift className="h-2.5 w-2.5" />
                              هدية
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.product.unit}
                      </TableCell>
                      <TableCell dir="ltr">{item.quantity}</TableCell>
                      <TableCell dir="ltr" className="font-mono">
                        {Number(item.unitPriceSnapshot).toFixed(2)} €
                      </TableCell>
                      <TableCell dir="ltr" className="font-mono">
                        {item.isGift ? (
                          <span className="text-amber-600 text-xs">مجاني</span>
                        ) : (
                          <span className="font-semibold">
                            {Number(item.subtotal).toFixed(2)} €
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="p-4 space-y-1.5 border-t">
                <div className="flex justify-between font-bold text-base">
                  <span>إجمالي الفاتورة</span>
                  <span dir="ltr">{invoiceTotal.toFixed(2)} €</span>
                </div>
                {giftItems.length > 0 && (
                  <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                    <span className="flex items-center gap-1">
                      <Gift className="h-3.5 w-3.5" />
                      الهدايا (في الحمولة — غير مُفوترة)
                    </span>
                    <span dir="ltr">
                      {giftItems.reduce((s, i) => s + i.quantity, 0)} كيس
                    </span>
                  </div>
                )}
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

        {/* ─── Sidebar: controls ───────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Status update */}
          <OrderStatusControls orderId={order.id} currentStatus={order.status} />

          {/* Assignment (vehicle + change distributor if needed) */}
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
                <span dir="ltr">
                  {new Date(order.createdAt).toLocaleDateString("ar-SA")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الحالة</span>
                <Badge
                  variant={statusInfo?.variant ?? "secondary"}
                  className="text-xs"
                >
                  {statusInfo?.label ?? order.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
