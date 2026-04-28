// GET /api/orders/[id]/events — return event log for an order
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverError } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const events = await prisma.orderEvent.findMany({
      where: { orderId: id },
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(events);
  } catch {
    return serverError();
  }
}
