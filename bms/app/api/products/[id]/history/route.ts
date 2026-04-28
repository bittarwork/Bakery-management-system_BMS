// GET /api/products/[id]/history — return price audit log for a product
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
    const logs = await prisma.productAuditLog.findMany({
      where: { productId: id },
      include: { user: { select: { name: true } } },
      orderBy: { changedAt: "desc" },
    });
    return NextResponse.json(logs);
  } catch {
    return serverError();
  }
}
