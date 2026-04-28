// Admin dashboard: shows today's key statistics and order status summary
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Truck,
  Store,
  Package,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default async function DashboardPage() {
  const session = await auth();
  const { start, end } = todayRange();

  // Fetch today's stats in parallel
  const [
    todayOrders,
    pendingAssignment,
    outForDelivery,
    delivered,
    totalShops,
    totalProducts,
    todayRevenue,
  ] = await Promise.all([
    prisma.order.count({
      where: { deliveryDate: { gte: start, lte: end } },
    }),
    prisma.order.count({
      where: {
        deliveryDate: { gte: start, lte: end },
        status: "ready_for_distribution",
        assignment: null,
      },
    }),
    prisma.order.count({
      where: { deliveryDate: { gte: start, lte: end }, status: "out_for_delivery" },
    }),
    prisma.order.count({
      where: { deliveryDate: { gte: start, lte: end }, status: "delivered" },
    }),
    prisma.shop.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.payment.aggregate({
      where: { paymentDate: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  // Recent orders for quick overview
  const recentOrders = await prisma.order.findMany({
    where: { deliveryDate: { gte: start, lte: end } },
    include: {
      shop: { select: { name: true } },
      assignment: {
        include: { distributor: { select: { name: true } } },
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const todayDate = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const revenue = todayRevenue._sum.amount?.toNumber() ?? 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">مرحباً، {session?.user.name}</h1>
        <p className="text-muted-foreground">{todayDate}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              طلبات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayOrders}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {delivered} مُسلَّم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              خارج للتسليم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{outForDelivery}</p>
            {pendingAssignment > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {pendingAssignment} ينتظر التعيين
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Store className="h-4 w-4" />
              المحلات النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalShops}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              مدفوعات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {revenue.toFixed(2)} €
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      {pendingAssignment > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold text-amber-800">
                {pendingAssignment} طلب يحتاج إلى تعيين موزّع
              </p>
              <p className="text-sm text-amber-600">انتقل إلى صفحة التوزيع لتعيين الطلبات</p>
            </div>
            <Button asChild variant="default" size="sm">
              <Link href="/distribution">
                <ArrowLeft className="h-4 w-4 ms-1" />
                التوزيع
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent orders table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">طلبات اليوم</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">عرض الكل</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد طلبات لليوم</p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/orders/new">إنشاء طلب جديد</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{order.shop.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order._count.items} صنف
                      {order.assignment && (
                        <> · {order.assignment.distributor.name}</>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink href="/orders/new" icon="➕" label="طلب جديد" />
        <QuickLink href="/shops" icon="🏪" label="المحلات" />
        <QuickLink href="/products" icon="📦" label="المنتجات" />
        <QuickLink href="/settings/users" icon="👥" label="المستخدمون" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "مسودة", variant: "secondary" },
    confirmed: { label: "مؤكد", variant: "outline" },
    ready_for_distribution: { label: "جاهز", variant: "default" },
    out_for_delivery: { label: "في الطريق", variant: "default" },
    delivered: { label: "مُسلَّم", variant: "outline" },
    cancelled: { label: "ملغى", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-center"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
