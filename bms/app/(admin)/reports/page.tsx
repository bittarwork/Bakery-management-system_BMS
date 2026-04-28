// Reports page: daily summary + shop balance overview
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportDateFilter } from "@/components/shared/report-date-filter";

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  confirmed: "مؤكد",
  ready_for_distribution: "جاهز للتوزيع",
  out_for_delivery: "في الطريق",
  delivered: "مُسلَّم",
  cancelled: "ملغى",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const filterDate = date ?? new Date().toISOString().split("T")[0];

  const start = new Date(`${filterDate}T00:00:00`);
  const end = new Date(`${filterDate}T23:59:59`);

  const [orderStats, dayPayments, shopData] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where: { deliveryDate: { gte: start, lte: end } },
      _count: { id: true },
    }),

    prisma.payment.aggregate({
      where: { paymentDate: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: { id: true },
    }),

    // All-time shop balances (total delivered orders value minus total payments)
    prisma.shop.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        phone: true,
        orders: {
          where: { status: "delivered" },
          select: { items: { select: { subtotal: true } } },
        },
        payments: { select: { amount: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Calculate per-shop outstanding balance
  const shopBalances = shopData
    .map((shop) => {
      const totalOrdered = shop.orders.reduce((sum, order) => {
        return sum + order.items.reduce((s, item) => s + Number(item.subtotal), 0);
      }, 0);
      const totalPaid = shop.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      return {
        id: shop.id,
        name: shop.name,
        phone: shop.phone,
        totalOrdered,
        totalPaid,
        balance: totalOrdered - totalPaid,
      };
    })
    .sort((a, b) => b.balance - a.balance);

  const totalBalance = shopBalances.reduce((sum, s) => sum + s.balance, 0);
  const todayPayments = dayPayments._sum.amount?.toNumber() ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">التقارير</h1>
          <p className="text-muted-foreground">ملخص يومي وأرصدة المحلات</p>
        </div>
        <ReportDateFilter currentDate={filterDate} />
      </div>

      {/* Day summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">مدفوعات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" dir="ltr">{todayPayments.toFixed(2)} €</p>
            <p className="text-xs text-muted-foreground">{dayPayments._count.id} دفعة</p>
          </CardContent>
        </Card>

        {orderStats.map((stat) => (
          <Card key={stat.status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {STATUS_LABELS[stat.status] ?? stat.status}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat._count.id}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shop balances table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">أرصدة المحلات المستحقة</CardTitle>
          <div className="text-sm font-mono text-destructive" dir="ltr">
            {totalBalance.toFixed(2)} € إجمالي مستحق
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المحل</TableHead>
                <TableHead>إجمالي الطلبات (€)</TableHead>
                <TableHead>إجمالي المدفوعات (€)</TableHead>
                <TableHead>الرصيد المستحق (€)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shopBalances.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell dir="ltr" className="font-mono">
                    {shop.totalOrdered.toFixed(2)}
                  </TableCell>
                  <TableCell dir="ltr" className="font-mono text-green-600">
                    {shop.totalPaid.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-mono font-semibold ${shop.balance > 0 ? "text-destructive" : "text-green-600"}`}
                      dir="ltr"
                    >
                      {shop.balance.toFixed(2)}
                    </span>
                    {shop.balance < 0 && (
                      <Badge variant="outline" className="mr-2 text-xs text-green-600">
                        زيادة
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
