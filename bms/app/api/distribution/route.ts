// GET /api/distribution — get today's distribution plan
// Returns all orders for a given date with assignment info and distributor list
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  try {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);

    const [orders, distributors, vehicles] = await Promise.all([
      prisma.order.findMany({
        where: {
          deliveryDate: { gte: start, lte: end },
          // v2: all orders start at ready_for_distribution — exclude only cancelled
          status: { not: "cancelled" },
        },
        include: {
          shop: { select: { name: true, address: true, latitude: true, longitude: true } },
          assignment: {
            include: {
              distributor: { select: { id: true, name: true } },
              vehicle: { select: { id: true, name: true, plateNumber: true } },
            },
          },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "DISTRIBUTOR", isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.vehicle.findMany({
        where: { isActive: true },
        select: { id: true, name: true, plateNumber: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ orders, distributors, vehicles });
  } catch {
    return serverError();
  }
}
