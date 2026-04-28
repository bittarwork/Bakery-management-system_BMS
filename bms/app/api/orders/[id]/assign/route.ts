// POST /api/orders/[id]/assign — assign order to a distributor (ADMIN only)
// PATCH /api/orders/[id]/assign — re-assign or update assignment (ADMIN only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, badRequest, serverError } from "@/lib/api-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth("ADMIN");
  if (error) return error;

  const { id } = await params;

  try {
    const { distributorId, vehicleId, notes } = await req.json();
    if (!distributorId) return badRequest("معرّف الموزّع مطلوب");

    const order = await prisma.order.findUnique({
      where: { id },
      include: { assignment: true },
    });

    if (!order) return badRequest("الطلب غير موجود");

    let assignment;

    if (order.assignment) {
      // Update existing assignment
      assignment = await prisma.distributionAssignment.update({
        where: { orderId: id },
        data: {
          distributorId,
          vehicleId: vehicleId ?? null,
          notes: notes ?? null,
          assignedById: session!.user.id,
          assignedAt: new Date(),
        },
      });
    } else {
      // Create new assignment
      assignment = await prisma.distributionAssignment.create({
        data: {
          orderId: id,
          distributorId,
          vehicleId: vehicleId ?? null,
          notes: notes ?? null,
          assignedById: session!.user.id,
        },
      });

      // Move order status to out_for_delivery if it was ready
      if (order.status === "ready_for_distribution") {
        await prisma.order.update({
          where: { id },
          data: { status: "out_for_delivery" },
        });
      }
    }

    // Get distributor name for event log
    const distributor = await prisma.user.findUnique({
      where: { id: distributorId },
      select: { name: true },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: id,
        actorId: session!.user.id,
        description: `تم تعيين الطلب للموزع: ${distributor?.name}`,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch {
    return serverError();
  }
}
