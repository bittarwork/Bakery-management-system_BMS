// GET /api/products — list all active products
// POST /api/products — create a new product (ADMIN only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, badRequest, serverError } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth("ADMIN");
  if (error) return error;

  try {
    const body = await req.json();
    const { name, sku, unit, unitPrice } = body;

    if (!name || !unit || unitPrice === undefined) {
      return badRequest("الاسم والوحدة والسعر مطلوبة");
    }

    const price = parseFloat(unitPrice);

    const product = await prisma.product.create({
      data: { name, sku: sku || null, unit, unitPrice: price },
    });

    // Log initial price in audit log
    await prisma.productAuditLog.create({
      data: {
        productId: product.id,
        oldPrice: 0,
        newPrice: price,
        changedBy: session!.user.id,
        note: "السعر الأولي عند إنشاء المنتج",
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch {
    return serverError();
  }
}
