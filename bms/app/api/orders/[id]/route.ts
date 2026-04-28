// GET /api/orders/[id] — get full order with items, events, assignment
// PATCH /api/orders/[id] — update order notes/items (ADMIN only, draft state only)
// DELETE /api/orders/[id] — cancel order (ADMIN only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, notFound, serverError } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        shop: true,
        items: {
          include: { product: { select: { id: true, name: true, unit: true } } },
        },
        events: {
          include: { actor: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        },
        assignment: {
          include: {
            distributor: { select: { id: true, name: true } },
            vehicle: true,
            assignedBy: { select: { name: true } },
          },
        },
        createdBy: { select: { name: true } },
      },
    });

    if (!order) return notFound("الطلب غير موجود");

    // Distributors can only view orders assigned to them
    if (session!.user.role === "DISTRIBUTOR") {
      if (order.assignment?.distributorId !== session!.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(order);
  } catch {
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth("ADMIN");
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.order.update({
      where: { id },
      data: { status: "cancelled" },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: id,
        actorId: session!.user.id,
        description: "تم إلغاء الطلب",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
