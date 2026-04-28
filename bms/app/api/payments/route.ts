// GET /api/payments — list payments (filterable by shopId, date range)
// POST /api/payments — record a new payment (ADMIN only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, badRequest, serverError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const shopId = searchParams.get("shopId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const payments = await prisma.payment.findMany({
      where: {
        ...(shopId ? { shopId } : {}),
        ...(from || to
          ? {
              paymentDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: {
        shop: { select: { name: true } },
        order: { select: { id: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json(payments);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth("ADMIN");
  if (error) return error;

  try {
    const body = await req.json();
    const { shopId, orderId, amount, method, paymentDate, reference, notes } = body;

    if (!shopId || !amount || !paymentDate) {
      return badRequest("المحل والمبلغ والتاريخ مطلوبة");
    }

    const payment = await prisma.payment.create({
      data: {
        shopId,
        orderId: orderId || null,
        amount: parseFloat(amount),
        method: method || "CASH",
        paymentDate: new Date(paymentDate),
        reference: reference || null,
        notes: notes || null,
        createdById: session!.user.id,
      },
      include: {
        shop: { select: { name: true } },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch {
    return serverError();
  }
}
