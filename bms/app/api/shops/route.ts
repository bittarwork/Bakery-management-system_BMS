// GET /api/shops — list all active shops
// POST /api/shops — create a new shop (ADMIN only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, badRequest, serverError } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const shops = await prisma.shop.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(shops);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth("ADMIN");
  if (error) return error;

  try {
    const body = await req.json();
    const { name, phone, email, shopType, address, city, latitude, longitude } = body;

    if (!name || !phone || !address || !city) {
      return badRequest("الاسم والهاتف والمدينة والعنوان مطلوبة");
    }

    const shop = await prisma.shop.create({
      data: {
        name,
        phone,
        email: email || null,
        shopType: shopType || "RETAIL",
        address,
        city,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
    });

    return NextResponse.json(shop, { status: 201 });
  } catch {
    return serverError();
  }
}
