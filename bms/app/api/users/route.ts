// GET /api/users — list all users (ADMIN only)
// POST /api/users — create a new user (ADMIN only)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, badRequest, serverError } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

export async function GET() {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth("ADMIN");
  if (error) return error;

  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return badRequest("الاسم والبريد الإلكتروني وكلمة المرور مطلوبة");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return badRequest("البريد الإلكتروني مستخدم مسبقاً");

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || "DISTRIBUTOR",
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return serverError();
  }
}
