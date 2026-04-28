// GET /api/orders — list orders (filterable by date, status, shopId)
// POST /api/orders — create a new order (ADMIN only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, badRequest, serverError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const shopId = searchParams.get("shopId");
  const distributorId = searchParams.get("distributorId");

  try {
    // Distributors can only see their own assigned orders
    const isDistributor = session!.user.role === "DISTRIBUTOR";

    const whereDate = date
      ? {
          deliveryDate: {
            gte: new Date(`${date}T00:00:00`),
            lte: new Date(`${date}T23:59:59`),
          },
        }
      : {};

    const orders = await prisma.order.findMany({
      where: {
        ...whereDate,
        ...(status ? { status: status as never } : {}),
        ...(shopId ? { shopId } : {}),
        ...(isDistributor
          ? { assignment: { distributorId: session!.user.id } }
          : distributorId
          ? { assignment: { distributorId } }
          : {}),
      },
      include: {
        shop: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
        assignment: {
          include: {
            distributor: { select: { id: true, name: true } },
            vehicle: { select: { name: true, plateNumber: true } },
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: { deliveryDate: "desc" },
    });

    return NextResponse.json(orders);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth("ADMIN");
  if (error) return error;

  try {
    const body = await req.json();
    const { shopId, deliveryDate, notes, items } = body;

    if (!shopId || !deliveryDate || !items?.length) {
      return badRequest("المحل وتاريخ التسليم والبنود مطلوبة");
    }

    // Build order items with current product prices as snapshot
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const orderItems = items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`منتج غير موجود: ${item.productId}`);
      const unitPrice = Number(product.unitPrice);
      const subtotal = unitPrice * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPriceSnapshot: unitPrice,
        subtotal,
      };
    });

    const order = await prisma.order.create({
      data: {
        shopId,
        deliveryDate: new Date(deliveryDate),
        notes: notes || null,
        status: "draft",
        createdById: session!.user.id,
        items: { create: orderItems },
        events: {
          create: {
            actorId: session!.user.id,
            description: "تم إنشاء الطلب",
          },
        },
      },
      include: {
        shop: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ في الخادم";
    return serverError(msg);
  }
}
