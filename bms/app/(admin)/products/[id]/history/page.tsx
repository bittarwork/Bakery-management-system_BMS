// Product price history page: shows all price changes with audit log
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingDown, TrendingUp, Minus } from "lucide-react";

export default async function ProductHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const logs = await prisma.productAuditLog.findMany({
    where: { productId: id },
    include: { user: { select: { name: true } } },
    orderBy: { changedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/products">
            <ArrowRight className="h-4 w-4 ml-1" />
            المنتجات
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">سجل الأسعار</h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            السعر الحالي:{" "}
            <span className="text-primary" dir="ltr">
              {Number(product.unitPrice).toFixed(2)} €
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">لا يوجد سجل أسعار</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const oldPrice = Number(log.oldPrice);
                const newPrice = Number(log.newPrice);
                const diff = newPrice - oldPrice;
                const isIncrease = diff > 0;
                const isDecrease = diff < 0;

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isIncrease ? (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        ) : isDecrease ? (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-mono text-sm" dir="ltr">
                          {oldPrice.toFixed(2)} € → {newPrice.toFixed(2)} €
                        </span>
                        {diff !== 0 && (
                          <Badge
                            variant={isIncrease ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {isIncrease ? "+" : ""}
                            {diff.toFixed(2)} €
                          </Badge>
                        )}
                      </div>
                      {log.note && (
                        <p className="text-xs text-muted-foreground">{log.note}</p>
                      )}
                    </div>
                    <div className="text-left text-xs text-muted-foreground">
                      <p>{log.user.name}</p>
                      <p dir="ltr">
                        {new Date(log.changedAt).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
