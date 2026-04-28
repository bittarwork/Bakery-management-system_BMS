// Seed script: populates the database with real shop data extracted from Excel delivery sheets (Schema v2)
import { PrismaClient } from "../generated/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Role, ShopType, PaymentMethod, OrderStatus } from "../generated/client/enums";
import * as dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL!;
const u = new URL(dbUrl);
const adapter = new PrismaMariaDb({
  host: u.hostname,
  port: parseInt(u.port || "3306"),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ""),
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database (Schema v2 — real shop data)...");

  // ─── Users ───────────────────────────────────────────────────────────────
  // Fixed IDs ensure session tokens remain valid across resets
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bms.com" },
    update: {},
    create: {
      id: "user-admin-001",
      name: "المدير",
      email: "admin@bms.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const dist1Password = await bcrypt.hash("dist123", 12);
  const distributor1 = await prisma.user.upsert({
    where: { email: "ali@bms.com" },
    update: {},
    create: {
      id: "user-dist-001",
      name: "علي الموزع",
      email: "ali@bms.com",
      passwordHash: dist1Password,
      role: Role.DISTRIBUTOR,
      isActive: true,
    },
  });

  const dist2Password = await bcrypt.hash("dist456", 12);
  const distributor2 = await prisma.user.upsert({
    where: { email: "omar@bms.com" },
    update: {},
    create: {
      id: "user-dist-002",
      name: "عمر الموزع",
      email: "omar@bms.com",
      passwordHash: dist2Password,
      role: Role.DISTRIBUTOR,
      isActive: true,
    },
  });

  // ─── Products ─────────────────────────────────────────────────────────────
  const whiteBread = await prisma.product.upsert({
    where: { sku: "BREAD-WHITE" },
    update: {},
    create: {
      name: "خبز أبيض",
      sku: "BREAD-WHITE",
      unit: "كيس",
      unitPrice: 13.0,
      isActive: true,
    },
  });

  const brownBread = await prisma.product.upsert({
    where: { sku: "BREAD-BROWN" },
    update: {},
    create: {
      name: "خبز بني",
      sku: "BREAD-BROWN",
      unit: "كيس",
      unitPrice: 13.0,
      isActive: true,
    },
  });

  // ─── Vehicle ──────────────────────────────────────────────────────────────
  const vehicle1 = await prisma.vehicle.upsert({
    where: { plateNumber: "1-ABC-234" },
    update: {},
    create: {
      name: "شاحنة التوزيع 1",
      plateNumber: "1-ABC-234",
      capacity: "500 كغ",
      isActive: true,
    },
  });

  await prisma.vehicle.upsert({
    where: { plateNumber: "2-XYZ-567" },
    update: {},
    create: {
      name: "فان التوزيع 2",
      plateNumber: "2-XYZ-567",
      capacity: "300 كغ",
      isActive: true,
    },
  });

  // ─── Shops — Dendermonde ───────────────────────────────────────────────────
  const shopJanMarkt = await prisma.shop.upsert({
    where: { id: "shop-01" },
    update: {},
    create: {
      id: "shop-01",
      name: "جان ماركت",
      phone: "+32 52 000 001",
      shopType: ShopType.RETAIL,
      address: "Dendermonde",
      city: "Dendermonde",
      latitude: 51.0286,
      longitude: 4.1013,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-02" },
    update: {},
    create: {
      id: "shop-02",
      name: "Dender Bakkerij",
      phone: "+32 52 000 002",
      shopType: ShopType.RETAIL,
      address: "Dendermonde",
      city: "Dendermonde",
      latitude: 51.0280,
      longitude: 4.1020,
      isActive: true,
    },
  });

  // ─── Shops — Lokeren ──────────────────────────────────────────────────────
  const shopDunya = await prisma.shop.upsert({
    where: { id: "shop-03" },
    update: {},
    create: {
      id: "shop-03",
      name: "Dunya Markt",
      phone: "+32 9 000 003",
      shopType: ShopType.RETAIL,
      address: "Lokeren",
      city: "Lokeren",
      latitude: 51.1025,
      longitude: 3.9887,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-04" },
    update: {},
    create: {
      id: "shop-04",
      name: "البركة",
      phone: "+32 9 000 004",
      shopType: ShopType.RETAIL,
      address: "Lokeren",
      city: "Lokeren",
      latitude: 51.1030,
      longitude: 3.9900,
      isActive: true,
    },
  });

  // ─── Shops — Temse ────────────────────────────────────────────────────────
  await prisma.shop.upsert({
    where: { id: "shop-05" },
    update: {},
    create: {
      id: "shop-05",
      name: "Berket Temse",
      phone: "+32 3 000 005",
      shopType: ShopType.RETAIL,
      address: "Temse",
      city: "Temse",
      latitude: 51.1250,
      longitude: 4.2098,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-06" },
    update: {},
    create: {
      id: "shop-06",
      name: "Ikram",
      phone: "+32 3 000 006",
      shopType: ShopType.RETAIL,
      address: "Temse",
      city: "Temse",
      latitude: 51.1260,
      longitude: 4.2110,
      isActive: true,
    },
  });

  // ─── Shops — Hamme ────────────────────────────────────────────────────────
  await prisma.shop.upsert({
    where: { id: "shop-07" },
    update: {},
    create: {
      id: "shop-07",
      name: "Katara",
      phone: "+32 52 000 007",
      shopType: ShopType.RETAIL,
      address: "Hamme",
      city: "Hamme",
      latitude: 51.0983,
      longitude: 4.1333,
      isActive: true,
    },
  });

  // ─── Shops — Sint-Niklaas ─────────────────────────────────────────────────
  const shopYildiz1 = await prisma.shop.upsert({
    where: { id: "shop-08" },
    update: {},
    create: {
      id: "shop-08",
      name: "يلدز 1",
      phone: "+32 3 000 008",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1589,
      longitude: 4.1420,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-09" },
    update: {},
    create: {
      id: "shop-09",
      name: "يلدز 2",
      phone: "+32 3 000 009",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1595,
      longitude: 4.1430,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-10" },
    update: {},
    create: {
      id: "shop-10",
      name: "أفغان ماركت",
      phone: "+32 3 000 010",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1600,
      longitude: 4.1440,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-11" },
    update: {},
    create: {
      id: "shop-11",
      name: "استنبول",
      phone: "+32 3 000 011",
      shopType: ShopType.RESTAURANT,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1605,
      longitude: 4.1450,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-12" },
    update: {},
    create: {
      id: "shop-12",
      name: "حلاق",
      phone: "+32 3 000 012",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1610,
      longitude: 4.1460,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-13" },
    update: {},
    create: {
      id: "shop-13",
      name: "يحيى",
      phone: "+32 3 000 013",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1615,
      longitude: 4.1470,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-14" },
    update: {},
    create: {
      id: "shop-14",
      name: "روزا",
      phone: "+32 3 000 014",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1620,
      longitude: 4.1480,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-15" },
    update: {},
    create: {
      id: "shop-15",
      name: "اوزتان",
      phone: "+32 3 000 015",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1625,
      longitude: 4.1490,
      isActive: true,
    },
  });

  const shopJaneen = await prisma.shop.upsert({
    where: { id: "shop-16" },
    update: {},
    create: {
      id: "shop-16",
      name: "جنين ماركت",
      phone: "+32 3 000 016",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1630,
      longitude: 4.1500,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-17" },
    update: {},
    create: {
      id: "shop-17",
      name: "Family Markt",
      phone: "+32 3 000 017",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1635,
      longitude: 4.1510,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-18" },
    update: {},
    create: {
      id: "shop-18",
      name: "Salam Slagerij",
      phone: "+32 3 000 018",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1640,
      longitude: 4.1520,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-19" },
    update: {},
    create: {
      id: "shop-19",
      name: "السلام",
      phone: "+32 3 000 019",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1645,
      longitude: 4.1530,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-20" },
    update: {},
    create: {
      id: "shop-20",
      name: "كابول سنت كلاس",
      phone: "+32 3 000 020",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1650,
      longitude: 4.1540,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-21" },
    update: {},
    create: {
      id: "shop-21",
      name: "يورو ماركت",
      phone: "+32 3 000 021",
      shopType: ShopType.RETAIL,
      address: "Sint-Niklaas",
      city: "Sint-Niklaas",
      latitude: 51.1655,
      longitude: 4.1550,
      isActive: true,
    },
  });

  // ─── Shops — Linkeroever (Antwerpen) ──────────────────────────────────────
  await prisma.shop.upsert({
    where: { id: "shop-22" },
    update: {},
    create: {
      id: "shop-22",
      name: "سوبر لينكروفر",
      phone: "+32 3 000 022",
      shopType: ShopType.RETAIL,
      address: "Linkeroever, Antwerpen",
      city: "Linkeroever",
      latitude: 51.2325,
      longitude: 4.3770,
      isActive: true,
    },
  });

  // ─── Shops — Berchem (Antwerpen) ──────────────────────────────────────────
  const shopMahaba = await prisma.shop.upsert({
    where: { id: "shop-23" },
    update: {},
    create: {
      id: "shop-23",
      name: "المحبة",
      phone: "+32 3 000 023",
      shopType: ShopType.RETAIL,
      address: "Berchem, Antwerpen",
      city: "Berchem",
      latitude: 51.1955,
      longitude: 4.4310,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-24" },
    update: {},
    create: {
      id: "shop-24",
      name: "سيد",
      phone: "+32 3 000 024",
      shopType: ShopType.RETAIL,
      address: "Berchem, Antwerpen",
      city: "Berchem",
      latitude: 51.1960,
      longitude: 4.4320,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-25" },
    update: {},
    create: {
      id: "shop-25",
      name: "باكستاني",
      phone: "+32 3 000 025",
      shopType: ShopType.RETAIL,
      address: "Berchem, Antwerpen",
      city: "Berchem",
      latitude: 51.1965,
      longitude: 4.4330,
      isActive: true,
    },
  });

  // ─── Shops — Deurne (Antwerpen) ───────────────────────────────────────────
  await prisma.shop.upsert({
    where: { id: "shop-26" },
    update: {},
    create: {
      id: "shop-26",
      name: "ميرام",
      phone: "+32 3 000 026",
      shopType: ShopType.RETAIL,
      address: "Deurne, Antwerpen",
      city: "Deurne",
      latitude: 51.2196,
      longitude: 4.4667,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-27" },
    update: {},
    create: {
      id: "shop-27",
      name: "السلطان دورنه",
      phone: "+32 3 000 027",
      shopType: ShopType.RESTAURANT,
      address: "Deurne, Antwerpen",
      city: "Deurne",
      latitude: 51.2200,
      longitude: 4.4680,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-28" },
    update: {},
    create: {
      id: "shop-28",
      name: "دورنة ماركت",
      phone: "+32 3 000 028",
      shopType: ShopType.RETAIL,
      address: "Deurne, Antwerpen",
      city: "Deurne",
      latitude: 51.2205,
      longitude: 4.4690,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-29" },
    update: {},
    create: {
      id: "shop-29",
      name: "أسواق الشام",
      phone: "+32 3 000 029",
      shopType: ShopType.RETAIL,
      address: "Deurne, Antwerpen",
      city: "Deurne",
      latitude: 51.2210,
      longitude: 4.4700,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-30" },
    update: {},
    create: {
      id: "shop-30",
      name: "عقبة دورنة",
      phone: "+32 3 000 030",
      shopType: ShopType.RETAIL,
      address: "Deurne, Antwerpen",
      city: "Deurne",
      latitude: 51.2215,
      longitude: 4.4710,
      isActive: true,
    },
  });

  // ─── Shops — Merksem (Antwerpen) ──────────────────────────────────────────
  await prisma.shop.upsert({
    where: { id: "shop-31" },
    update: {},
    create: {
      id: "shop-31",
      name: "سينا ماركت",
      phone: "+32 3 000 031",
      shopType: ShopType.RETAIL,
      address: "Merksem, Antwerpen",
      city: "Merksem",
      latitude: 51.2543,
      longitude: 4.4270,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-32" },
    update: {},
    create: {
      id: "shop-32",
      name: "إينا ماركت مركسم",
      phone: "+32 3 000 032",
      shopType: ShopType.RETAIL,
      address: "Merksem, Antwerpen",
      city: "Merksem",
      latitude: 51.2548,
      longitude: 4.4280,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-33" },
    update: {},
    create: {
      id: "shop-33",
      name: "أسلان مركسم",
      phone: "+32 3 000 033",
      shopType: ShopType.RETAIL,
      address: "Merksem, Antwerpen",
      city: "Merksem",
      latitude: 51.2553,
      longitude: 4.4290,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-34" },
    update: {},
    create: {
      id: "shop-34",
      name: "مريم مركسم",
      phone: "+32 3 000 034",
      shopType: ShopType.RETAIL,
      address: "Merksem, Antwerpen",
      city: "Merksem",
      latitude: 51.2558,
      longitude: 4.4300,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-35" },
    update: {},
    create: {
      id: "shop-35",
      name: "Eco Markt",
      phone: "+32 3 000 035",
      shopType: ShopType.RETAIL,
      address: "Merksem, Antwerpen",
      city: "Merksem",
      latitude: 51.2563,
      longitude: 4.4310,
      isActive: true,
    },
  });

  // ─── Shops — Antwerpen (Centre) ───────────────────────────────────────────
  await prisma.shop.upsert({
    where: { id: "shop-36" },
    update: {},
    create: {
      id: "shop-36",
      name: "ناديا انتورب",
      phone: "+32 3 000 036",
      shopType: ShopType.RETAIL,
      address: "Antwerpen",
      city: "Antwerpen",
      latitude: 51.2213,
      longitude: 4.4051,
      isActive: true,
    },
  });

  await prisma.shop.upsert({
    where: { id: "shop-37" },
    update: {},
    create: {
      id: "shop-37",
      name: "Harun / Jupiter",
      phone: "+32 3 000 037",
      shopType: ShopType.RETAIL,
      address: "Antwerpen",
      city: "Antwerpen",
      latitude: 51.2220,
      longitude: 4.4060,
      isActive: true,
    },
  });

  // ─── Sample Orders — today (to demonstrate the workflow) ──────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Order 1: normal order — ready for distribution (جان ماركت)
  const existingOrder1 = await prisma.order.findFirst({
    where: { shopId: shopJanMarkt.id, deliveryDate: today },
  });

  if (!existingOrder1) {
    const order1 = await prisma.order.create({
      data: {
        shopId: shopJanMarkt.id,
        deliveryDate: today,
        status: OrderStatus.ready_for_distribution,
        notes: "4 أكياس خبز أبيض",
        createdById: admin.id,
        distributorId: distributor1.id,
        items: {
          create: [
            {
              productId: whiteBread.id,
              quantity: 4,
              unitPriceSnapshot: 13.0,
              subtotal: 52.0,
              isGift: false,
            },
          ],
        },
        events: {
          create: {
            actorId: admin.id,
            description: "تم إنشاء الطلب وتعيينه لعلي",
          },
        },
      },
    });

    await prisma.distributionAssignment.create({
      data: {
        orderId: order1.id,
        distributorId: distributor1.id,
        vehicleId: vehicle1.id,
        assignedById: admin.id,
      },
    });
  }

  // Order 2: normal order with gift item — Dunya Markt
  const existingOrder2 = await prisma.order.findFirst({
    where: { shopId: shopDunya.id, deliveryDate: today },
  });

  if (!existingOrder2) {
    const order2 = await prisma.order.create({
      data: {
        shopId: shopDunya.id,
        deliveryDate: today,
        status: OrderStatus.ready_for_distribution,
        notes: "2 خبز أبيض + هدية خبز بني",
        createdById: admin.id,
        distributorId: distributor1.id,
        items: {
          create: [
            {
              productId: whiteBread.id,
              quantity: 2,
              unitPriceSnapshot: 13.0,
              subtotal: 26.0,
              isGift: false,
            },
            {
              // gift item — counted in vehicle load only, not invoiced
              productId: brownBread.id,
              quantity: 1,
              unitPriceSnapshot: 13.0,
              subtotal: 13.0,
              isGift: true,
            },
          ],
        },
        events: {
          create: {
            actorId: admin.id,
            description: "تم إنشاء الطلب — يشمل هدية خبز بني",
          },
        },
      },
    });

    await prisma.distributionAssignment.create({
      data: {
        orderId: order2.id,
        distributorId: distributor1.id,
        vehicleId: vehicle1.id,
        assignedById: admin.id,
      },
    });
  }

  // Order 3: delivered yesterday — CREDIT payment (debt example for جنين ماركت)
  const existingOrder3 = await prisma.order.findFirst({
    where: { shopId: shopJaneen.id, deliveryDate: yesterday },
  });

  if (!existingOrder3) {
    const order3 = await prisma.order.create({
      data: {
        shopId: shopJaneen.id,
        deliveryDate: yesterday,
        status: OrderStatus.delivered,
        notes: "7 خبز أبيض — دفع بالدين",
        createdById: admin.id,
        distributorId: distributor2.id,
        items: {
          create: [
            {
              productId: whiteBread.id,
              quantity: 7,
              unitPriceSnapshot: 13.0,
              subtotal: 91.0,
              isGift: false,
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

    // CREDIT payment — no cash received, full amount becomes debt
    await prisma.payment.create({
      data: {
        shopId: shopJaneen.id,
        orderId: order3.id,
        amount: 91.0,
        method: PaymentMethod.CREDIT,
        paymentDate: yesterday,
        notes: "دفع بالدين — 7 أكياس",
        createdById: distributor2.id,
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order3.id,
        actorId: distributor2.id,
        description: "تم التسليم — الدفع بالدين",
      },
    });
  }

  // Order 4: delivered — split payment CASH + CREDIT (المحبة)
  const existingOrder4 = await prisma.order.findFirst({
    where: { shopId: shopMahaba.id, deliveryDate: yesterday },
  });

  if (!existingOrder4) {
    const order4 = await prisma.order.create({
      data: {
        shopId: shopMahaba.id,
        deliveryDate: yesterday,
        status: OrderStatus.delivered,
        notes: "8 خبز أبيض + 0.5 بني — دفع مجزأ",
        createdById: admin.id,
        distributorId: distributor2.id,
        items: {
          create: [
            {
              productId: whiteBread.id,
              quantity: 8,
              unitPriceSnapshot: 13.0,
              subtotal: 104.0,
              isGift: false,
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

    // Split: 50€ cash + remaining as credit
    await prisma.payment.create({
      data: {
        shopId: shopMahaba.id,
        orderId: order4.id,
        amount: 50.0,
        method: PaymentMethod.CASH,
        paymentDate: yesterday,
        notes: "دفعة نقدية جزئية",
        createdById: distributor2.id,
      },
    });

    await prisma.payment.create({
      data: {
        shopId: shopMahaba.id,
        orderId: order4.id,
        amount: 54.0,
        method: PaymentMethod.CREDIT,
        paymentDate: yesterday,
        notes: "الجزء المتبقي بالدين",
        createdById: distributor2.id,
      },
    });

    // Partial settlement via bank transfer
    await prisma.payment.create({
      data: {
        shopId: shopMahaba.id,
        amount: 30.0,
        method: PaymentMethod.INSTALLMENT,
        paymentDate: today,
        notes: "دفعة على الدين القديم",
        createdById: admin.id,
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order4.id,
        actorId: distributor2.id,
        description: "تم التسليم — دفع مجزأ: 50€ نقد + 54€ دين",
      },
    });
  }

  console.log("✅ Seed completed!");
  console.log("─────────────────────────────────────────────────────────────────");
  console.log("👤 Admin:        admin@bms.com   / admin123");
  console.log("👤 Distributor1: ali@bms.com     / dist123");
  console.log("👤 Distributor2: omar@bms.com    / dist456");
  console.log("─────────────────────────────────────────────────────────────────");
  console.log("🏪 37 shops seeded across: Dendermonde, Lokeren, Temse, Hamme,");
  console.log("   Sint-Niklaas, Linkeroever, Berchem, Deurne, Merksem, Antwerpen");
  console.log("─────────────────────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
