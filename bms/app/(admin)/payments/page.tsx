// Payments page: list payments and record new ones
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
import { NewPaymentDialog } from "@/components/shared/new-payment-dialog";

const METHOD_LABELS: Record<string, string> = {
  CASH: "نقداً",
  BANK_TRANSFER: "تحويل بنكي",
  CHECK: "شيك",
  OTHER: "أخرى",
};

export default async function PaymentsPage() {
  const [payments, shops] = await Promise.all([
    prisma.payment.findMany({
      include: {
        shop: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { paymentDate: "desc" },
      take: 100,
    }),
    prisma.shop.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المدفوعات</h1>
          <p className="text-muted-foreground">
            {payments.length} دفعة · إجمالي:{" "}
            <span dir="ltr">{totalReceived.toFixed(2)} €</span>
          </p>
        </div>
        <NewPaymentDialog shops={shops} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المحل</TableHead>
                <TableHead>المبلغ (€)</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المرجع</TableHead>
                <TableHead>بواسطة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.shop.name}
                  </TableCell>
                  <TableCell className="font-mono" dir="ltr">
                    {Number(payment.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {METHOD_LABELS[payment.method] ?? payment.method}
                    </Badge>
                  </TableCell>
                  <TableCell dir="ltr">
                    {new Date(payment.paymentDate).toLocaleDateString("ar-SA")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.reference ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.createdBy.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {payments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>لا توجد مدفوعات مسجّلة بعد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
