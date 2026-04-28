// Distribution planning page: assign distributors to today's orders
import { prisma } from "@/lib/prisma";
import { DistributionBoard } from "@/components/shared/distribution-board";

export default async function DistributionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const filterDate = date ?? new Date().toISOString().split("T")[0];

  const start = new Date(`${filterDate}T00:00:00`);
  const end = new Date(`${filterDate}T23:59:59`);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">خطة التوزيع</h1>
        <p className="text-muted-foreground">
          {new Date(filterDate).toLocaleDateString("ar-SA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <DistributionBoard
        orders={orders.map((o) => ({
          id: o.id,
          shopName: o.shop.name,
          shopAddress: o.shop.address,
          latitude: o.shop.latitude ?? undefined,
          longitude: o.shop.longitude ?? undefined,
          itemCount: o._count.items,
          status: o.status,
          assignment: o.assignment
            ? {
                distributorId: o.assignment.distributorId,
                distributorName: o.assignment.distributor.name,
                vehicleId: o.assignment.vehicleId ?? undefined,
                vehicleName: o.assignment.vehicle?.name,
              }
            : undefined,
        }))}
        distributors={distributors}
        vehicles={vehicles}
        filterDate={filterDate}
      />
    </div>
  );
}
