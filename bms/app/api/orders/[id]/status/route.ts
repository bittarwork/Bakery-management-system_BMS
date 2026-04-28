// PATCH /api/orders/[id]/status — update order status
// ADMIN can update any status; DISTRIBUTOR can only mark their assigned orders as delivered
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, badRequest, serverError } from "@/lib/api-helpers";
import type { OrderStatus } from "@/generated/client/enums";

// Valid status transitions per role
const ADMIN_TRANSITIONS: Record<string, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["ready_for_distribution", "cancelled"],
  ready_for_distribution: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "تم تأكيد الطلب",
  ready_for_distribution: "الطلب جاهز للتوزيع",
  out_for_delivery: "الطلب خرج للتسليم",
  delivered: "تم تسليم الطلب",
  cancelled: "تم إلغاء الطلب",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const { status } = await req.json();
    if (!status) return badRequest("الحالة مطلوبة");

    const order = await prisma.order.findUnique({
      where: { id },
      include: { assignment: true },
    });

    if (!order) return badRequest("الطلب غير موجود");

    const isAdmin = session!.user.role === "ADMIN";
    const isDistributor = session!.user.role === "DISTRIBUTOR";

    // Distributors can only mark their own assigned orders as delivered
    if (isDistributor) {
      if (order.assignment?.distributorId !== session!.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (status !== "delivered" || order.status !== "out_for_delivery") {
        return badRequest("الموزّع يمكنه فقط تحديث الطلب إلى مُسلَّم");
      }
    }

    // Validate transition for admin
    if (isAdmin) {
      const allowed = ADMIN_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(status as OrderStatus)) {
        return badRequest(`لا يمكن تغيير الحالة من ${order.status} إلى ${status}`);
      }
    }

    await prisma.order.update({ where: { id }, data: { status } });

    await prisma.orderEvent.create({
      data: {
        orderId: id,
        actorId: session!.user.id,
        description: STATUS_LABELS[status] ?? `تم تغيير الحالة إلى ${status}`,
      },
    });

    return NextResponse.json({ success: true, status });
  } catch {
    return serverError();
  }
}
