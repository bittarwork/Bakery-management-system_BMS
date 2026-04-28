// GET /api/products/[id] — get product details
// PATCH /api/products/[id] — update product + log price change if changed
// DELETE /api/products/[id] — soft delete (ADMIN only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, notFound, serverError } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return notFound("المنتج غير موجود");
    return NextResponse.json(product);
  } catch {
    return serverError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth("ADMIN");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await req.json();
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return notFound("المنتج غير موجود");

    const newPrice = body.unitPrice !== undefined
      ? parseFloat(body.unitPrice)
      : Number(existing.unitPrice);
    const oldPrice = Number(existing.unitPrice);

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        sku: body.sku !== undefined ? body.sku : existing.sku,
        unit: body.unit ?? existing.unit,
        unitPrice: newPrice,
        isActive: body.isActive ?? existing.isActive,
      },
    });

    // Log price change if the price was modified
    if (body.unitPrice !== undefined && oldPrice !== newPrice) {
      await prisma.productAuditLog.create({
        data: {
          productId: id,
          oldPrice,
          newPrice,
          changedBy: session!.user.id,
          note: body.priceNote || null,
        },
      });
    }

    return NextResponse.json(product);
  } catch {
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
