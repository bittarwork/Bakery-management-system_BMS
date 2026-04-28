// GET /api/shops/[id] — get single shop
// PATCH /api/shops/[id] — update shop (ADMIN only)
// DELETE /api/shops/[id] — soft-delete shop (ADMIN only)
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
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) return notFound("المحل غير موجود");
    return NextResponse.json(shop);
  } catch {
    return serverError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  const { id } = await params;

  try {
    const body = await req.json();
    const shop = await prisma.shop.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email ?? null,
        shopType: body.shopType,
        address: body.address,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(shop);
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
    // Soft delete: mark as inactive instead of removing from DB
    await prisma.shop.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
