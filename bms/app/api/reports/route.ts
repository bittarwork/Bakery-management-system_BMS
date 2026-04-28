// GET /api/reports — generate daily summary and shop balances
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  try {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);

    // Daily order summary
    const [orderStats, dayPayments, shopBalances] = await Promise.all([
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

      // Per-shop balance: total order value minus total payments
      prisma.shop.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          phone: true,
          orders: {
            where: { status: "delivered" },
            select: {
              items: { select: { subtotal: true } },
            },
          },
          payments: {
            select: { amount: true },
          },
        },
      }),
    ]);

    // Calculate balance per shop
    const balances = shopBalances.map((shop) => {
      const totalOrdered = shop.orders.reduce((sum, order) => {
        const orderTotal = order.items.reduce(
          (s, item) => s + Number(item.subtotal),
          0
        );
        return sum + orderTotal;
      }, 0);

      const totalPaid = shop.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      return {
        shopId: shop.id,
        shopName: shop.name,
        phone: shop.phone,
        totalOrdered: totalOrdered.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        balance: (totalOrdered - totalPaid).toFixed(2),
      };
    });

    // Sort by outstanding balance descending
    balances.sort((a, b) => Number(b.balance) - Number(a.balance));

    return NextResponse.json({
      date,
      orderStats,
      dayPayments: {
        total: dayPayments._sum.amount?.toNumber().toFixed(2) ?? "0.00",
        count: dayPayments._count.id,
      },
      shopBalances: balances,
    });
  } catch {
    return serverError();
  }
}
