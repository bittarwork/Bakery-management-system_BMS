// Distributor order detail page: shows items, map link, and delivery button — mobile-first
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeliverButton } from "@/components/shared/deliver-button";
import { MapPin, Phone, ArrowRight, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DistributorOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      shop: true,
      items: {
        include: { product: { select: { name: true, unit: true } } },
      },
      assignment: true,
    },
  });

  if (!order) notFound();

  // Ensure this order belongs to the current distributor
  if (order.assignment?.distributorId !== userId) {
    redirect("/my-orders");
  }

  const isDelivered = order.status === "delivered";
  const orderTotal = order.items.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0
  );

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="-mr-2">
        <Link href="/my-orders">
          <ArrowRight className="h-4 w-4 ml-1" />
          الطلبات
        </Link>
      </Button>

      {/* Shop info */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-start justify-between">
            <h1 className="text-lg font-bold">{order.shop.name}</h1>
            {isDelivered ? (
              <Badge variant="outline" className="text-green-600">
                مُسلَّم ✓
              </Badge>
            ) : (
              <Badge>في الطريق</Badge>
            )}
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{order.shop.address}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <a href={`tel:${order.shop.phone}`} className="text-primary" dir="ltr">
              {order.shop.phone}
            </a>
          </div>

          {order.shop.latitude && order.shop.longitude && (
            <a
              href={`https://www.google.com/maps?q=${order.shop.latitude},${order.shop.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary font-medium"
            >
              <MapPin className="h-4 w-4" />
              فتح التنقل في خرائط جوجل ↗
            </a>
          )}
        </CardContent>
      </Card>

      {/* Order items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            بنود الطلب ({order.items.length} صنف)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">{item.product.unit}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{item.quantity}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  × {Number(item.unitPriceSnapshot).toFixed(2)} €
                </p>
              </div>
            </div>
          ))}

          <Separator />
          <div className="flex justify-between font-bold">
            <span>الإجمالي</span>
            <span dir="ltr">{orderTotal.toFixed(2)} €</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Delivery action button — only shown if not yet delivered */}
      {!isDelivered && (
        <DeliverButton orderId={order.id} />
      )}
    </div>
  );
}
