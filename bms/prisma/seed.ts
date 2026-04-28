// Seed script: populates the database with initial test data
import { PrismaClient } from "../generated/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Role, ShopType, PaymentMethod } from "../generated/client/enums";
import * as dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || "3306"),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    connectionLimit: 5,
  };
}

const dbUrl = process.env.DATABASE_URL!;
const adapter = new PrismaMariaDb(parseDbUrl(dbUrl));
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bms.com" },
    update: {},
    create: {
      name: "المدير",
      email: "admin@bms.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // Create two distributors
  const dist1Password = await bcrypt.hash("dist123", 12);
  const distributor1 = await prisma.user.upsert({
    where: { email: "ali@bms.com" },
    update: {},
    create: {
      name: "علي الموزع",
      email: "ali@bms.com",
      passwordHash: dist1Password,
      role: Role.DISTRIBUTOR,
      isActive: true,
    },
  });

  const dist2Password = await bcrypt.hash("dist456", 12);
  await prisma.user.upsert({
    where: { email: "omar@bms.com" },
    update: {},
    create: {
      name: "عمر الموزع",
      email: "omar@bms.com",
      passwordHash: dist2Password,
      role: Role.DISTRIBUTOR,
      isActive: true,
    },
  });

  // Create sample shops
  const shop1 = await prisma.shop.upsert({
    where: { id: "shop-001" },
    update: {},
    create: {
      id: "shop-001",
      name: "مخبز الأمل",
      phone: "+32 2 123 4567",
      email: "alamal@example.com",
      shopType: ShopType.RETAIL,
      address: "Rue de la Loi 12, 1000 Bruxelles",
      latitude: 50.8503,
      longitude: 4.3517,
      isActive: true,
    },
  });

  const shop2 = await prisma.shop.upsert({
    where: { id: "shop-002" },
    update: {},
    create: {
      id: "shop-002",
      name: "كافيه النور",
      phone: "+32 2 987 6543",
      shopType: ShopType.CAFE,
      address: "Avenue Louise 45, 1050 Ixelles",
      latitude: 50.8284,
      longitude: 4.3608,
      isActive: true,
    },
  });

  // Create sample products
  const bread = await prisma.product.upsert({
    where: { sku: "BREAD-001" },
    update: {},
    create: {
      name: "خبز أبيض",
      sku: "BREAD-001",
      unit: "رغيف",
      unitPrice: 0.5,
      isActive: true,
    },
  });

  const croissant = await prisma.product.upsert({
    where: { sku: "CROS-001" },
    update: {},
    create: {
      name: "كرواسان",
      sku: "CROS-001",
      unit: "قطعة",
      unitPrice: 1.2,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: "CAKE-001" },
    update: {},
    create: {
      name: "كيك شوكولاتة",
      sku: "CAKE-001",
      unit: "قطعة",
      unitPrice: 3.5,
      isActive: true,
    },
  });

  // Create a sample vehicle
  const vehicle = await prisma.vehicle.upsert({
    where: { plateNumber: "1-ABC-234" },
    update: {},
    create: {
      name: "شاحنة التوزيع الرئيسية",
      plateNumber: "1-ABC-234",
      capacity: "500 كغ",
      isActive: true,
    },
  });

  // Create a sample order for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingOrder = await prisma.order.findFirst({
    where: { shopId: shop1.id, deliveryDate: today },
  });

  if (!existingOrder) {
    const order = await prisma.order.create({
      data: {
        shopId: shop1.id,
        deliveryDate: today,
        status: "confirmed",
        notes: "طلب تجريبي للاختبار",
        createdById: admin.id,
        items: {
          create: [
            {
              productId: bread.id,
              quantity: 50,
              unitPriceSnapshot: 0.5,
              subtotal: 25.0,
            },
            {
              productId: croissant.id,
              quantity: 20,
              unitPriceSnapshot: 1.2,
              subtotal: 24.0,
            },
          ],
        },
        events: {
          create: {
            actorId: admin.id,
            description: "تم إنشاء الطلب",
          },
        },
      },
    });

    // Assign the order to distributor 1
    await prisma.distributionAssignment.create({
      data: {
        orderId: order.id,
        distributorId: distributor1.id,
        vehicleId: vehicle.id,
        assignedById: admin.id,
      },
    });

    // Add assignment event
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        actorId: admin.id,
        description: `تم تعيين الطلب للموزع: ${distributor1.name}`,
      },
    });
  }

  // Sample payment for shop2
  const existingPayment = await prisma.payment.findFirst({
    where: { shopId: shop2.id },
  });

  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        shopId: shop2.id,
        amount: 150.0,
        method: PaymentMethod.CASH,
        paymentDate: today,
        notes: "دفعة تجريبية",
        createdById: admin.id,
      },
    });
  }

  console.log("✅ Seed completed!");
  console.log("─────────────────────────────────────");
  console.log("👤 Admin:        admin@bms.com     / admin123");
  console.log("👤 Distributor1: ali@bms.com       / dist123");
  console.log("👤 Distributor2: omar@bms.com      / dist456");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
