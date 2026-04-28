// Shops list page: displays all shops with options to add, edit, and deactivate
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin, Phone, Pencil } from "lucide-react";

export default async function ShopsPage() {
  const shops = await prisma.shop.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المحلات</h1>
          <p className="text-muted-foreground">{shops.length} محل مسجّل</p>
        </div>
        <Button asChild>
          <Link href="/shops/new">
            <Plus className="h-4 w-4 ml-2" />
            محل جديد
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shops.map((shop) => (
          <Card key={shop.id} className={!shop.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{shop.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={shop.isActive ? "default" : "secondary"}>
                    {shop.isActive ? "نشط" : "غير نشط"}
                  </Badge>
                  <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                    <Link href={`/shops/${shop.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span dir="ltr">{shop.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{shop.address}</span>
              </div>
              {shop.latitude && shop.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  عرض على الخريطة ↗
                </a>
              )}
              <p className="text-xs text-muted-foreground">
                {shop._count.orders} طلب إجمالي
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {shops.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">لا توجد محلات بعد</p>
          <Button asChild className="mt-4">
            <Link href="/shops/new">إضافة أول محل</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
