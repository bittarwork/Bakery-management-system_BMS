// GET /api/orders — list orders (filterable by date, status, shopId, distributorId)
// POST /api/orders — create a new order with distributor assignment (ADMIN only)
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
        // Distributors see only their assigned orders via the direct distributorId field
        ...(isDistributor
          ? { distributorId: session!.user.id }
          : distributorId
          ? { distributorId }
          : {}),
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        distributor: { select: { id: true, name: true } },
        assignment: {
          include: {
            distributor: { select: { id: true, name: true } },
            vehicle: { select: { name: true, plateNumber: true } },
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: [{ deliveryDate: "desc" }, { createdAt: "desc" }],
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
    const { shopId, deliveryDate, notes, distributorId, items } = body;

    // All fields are required for order creation
    if (!shopId || !deliveryDate || !distributorId || !items?.length) {
      return badRequest("المحل وتاريخ التسليم والموزع والبنود مطلوبة");
    }

    // Validate distributor exists and is active
    const distributor = await prisma.user.findFirst({
      where: { id: distributorId, role: "DISTRIBUTOR", isActive: true },
      select: { id: true, name: true },
    });
    if (!distributor) {
      return badRequest("الموزع المختار غير موجود أو غير نشط");
    }

    // Validate shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true },
    });
    if (!shop) {
      return badRequest("المحل غير موجود");
    }

    // Snapshot product prices at order creation time
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const orderItems = items.map(
      (item: { productId: string; quantity: number; isGift?: boolean }) => {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`منتج غير موجود: ${item.productId}`);
        const unitPrice = Number(product.unitPrice);
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPriceSnapshot: unitPrice,
          // Gift items have subtotal = 0 in the invoice; price snapshot kept for reference
          subtotal: item.isGift ? 0 : unitPrice * item.quantity,
          isGift: item.isGift ?? false,
        };
      }
    );

    // Create order + DistributionAssignment atomically in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          shopId,
          deliveryDate: new Date(deliveryDate),
          notes: notes || null,
          // Order starts at ready_for_distribution — no draft/confirmed steps
          status: "ready_for_distribution",
          createdById: session!.user.id,
          distributorId,
          items: { create: orderItems },
          events: {
            create: {
              actorId: session!.user.id,
              description: `تم إنشاء الطلب وتعيينه للموزع: ${distributor.name}`,
            },
          },
        },
        include: {
          shop: { select: { name: true, city: true } },
          distributor: { select: { name: true } },
          items: {
            include: { product: { select: { name: true, unit: true } } },
          },
        },
      });

      // Create DistributionAssignment for backward compatibility and vehicle tracking
      await tx.distributionAssignment.create({
        data: {
          orderId: newOrder.id,
          distributorId,
          assignedById: session!.user.id,
        },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ في الخادم";
    return serverError(msg);
  }
}
